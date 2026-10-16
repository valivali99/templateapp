import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { db, transaction } from '../db.js';
import { config } from '../config.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const MAX_IMAGES = 10;

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }));
  },
});

// Reads are public (guests can browse); writes require an admin token.
export const tilesRouter = Router();

function imagesFor(tileId) {
  return db
    .prepare('SELECT id, filename FROM tile_images WHERE tile_id = ? ORDER BY position')
    .all(tileId)
    .map((img) => ({ id: img.id, url: `/uploads/${img.filename}` }));
}

function toTile(row) {
  const images = imagesFor(row.id);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    images,
    mainImage: images[0]?.url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function removeFiles(filenames) {
  for (const name of filenames) {
    fs.rm(path.join(config.uploadsDir, name), { force: true }, () => {});
  }
}

function validate(body) {
  const name = String(body?.name ?? '').trim();
  const description = String(body?.description ?? '').trim();
  if (!name) return { error: 'Name is required' };
  if (name.length > 120) return { error: 'Name is too long' };
  return { name, description };
}

tilesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM tiles ORDER BY created_at DESC, id DESC').all();
  res.json(rows.map(toTile));
});

tilesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tiles WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ message: 'Tile not found' });
  res.json(toTile(row));
});

// multipart/form-data: name, description, images[] (first one becomes the main image)
tilesRouter.post('/', requireAuth, requireAdmin, upload.array('images', MAX_IMAGES), (req, res) => {
  const files = req.files ?? [];
  const input = validate(req.body);
  if (input.error) {
    removeFiles(files.map((f) => f.filename));
    return res.status(400).json({ message: input.error });
  }

  const id = transaction(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO tiles (name, description) VALUES (?, ?)')
      .run(input.name, input.description);
    const insertImage = db.prepare('INSERT INTO tile_images (tile_id, filename, position) VALUES (?, ?, ?)');
    files.forEach((f, i) => insertImage.run(lastInsertRowid, f.filename, i));
    return lastInsertRowid;
  });

  res.status(201).json(toTile(db.prepare('SELECT * FROM tiles WHERE id = ?').get(id)));
});

// multipart/form-data: name, description, images[] (new files),
//   order: optional JSON array describing the final image order, e.g. ["existing:4", "new:0", "existing:2"].
//          Existing images not listed are deleted; new files not listed are appended.
//          Without it, existing images are kept as-is and new files are appended.
tilesRouter.put('/:id', requireAuth, requireAdmin, upload.array('images', MAX_IMAGES), (req, res) => {
  const files = req.files ?? [];
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM tiles WHERE id = ?').get(id);
  const input = validate(req.body);

  if (!row || input.error) {
    removeFiles(files.map((f) => f.filename));
    return row
      ? res.status(400).json({ message: input.error })
      : res.status(404).json({ message: 'Tile not found' });
  }

  const existing = db.prepare('SELECT id, filename FROM tile_images WHERE tile_id = ? ORDER BY position').all(id);
  let order;
  try {
    order = req.body.order === undefined
      ? existing.map((img) => `existing:${img.id}`)
      : JSON.parse(req.body.order);
    if (!Array.isArray(order)) throw new Error();
  } catch {
    removeFiles(files.map((f) => f.filename));
    return res.status(400).json({ message: 'order must be a JSON array' });
  }

  // Resolve the order into a list of { id } (existing) or { file } (new), ignoring unknown entries.
  const existingById = new Map(existing.map((img) => [img.id, img]));
  const usedFiles = new Set();
  const usedIds = new Set();
  const final = [];
  for (const entry of order) {
    const [kind, ref] = String(entry).split(':');
    const n = Number(ref);
    if (kind === 'existing' && existingById.has(n) && !usedIds.has(n)) {
      usedIds.add(n);
      final.push({ id: n });
    } else if (kind === 'new' && files[n] && !usedFiles.has(n)) {
      usedFiles.add(n);
      final.push({ file: files[n] });
    }
  }
  files.forEach((file, i) => !usedFiles.has(i) && final.push({ file }));
  const removed = existing.filter((img) => !usedIds.has(img.id));

  if (final.length > MAX_IMAGES) {
    removeFiles(files.map((f) => f.filename));
    return res.status(400).json({ message: `A tile can have at most ${MAX_IMAGES} images` });
  }

  transaction(() => {
    db.prepare("UPDATE tiles SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?")
      .run(input.name, input.description, id);

    const del = db.prepare('DELETE FROM tile_images WHERE id = ?');
    removed.forEach((img) => del.run(img.id));

    const setPos = db.prepare('UPDATE tile_images SET position = ? WHERE id = ?');
    const insertImage = db.prepare('INSERT INTO tile_images (tile_id, filename, position) VALUES (?, ?, ?)');
    final.forEach((item, i) => (item.file ? insertImage.run(id, item.file.filename, i) : setPos.run(i, item.id)));
  });

  removeFiles(removed.map((img) => img.filename));
  res.json(toTile(db.prepare('SELECT * FROM tiles WHERE id = ?').get(id)));
});

tilesRouter.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const filenames = db.prepare('SELECT filename FROM tile_images WHERE tile_id = ?').all(id).map((r) => r.filename);
  const { changes } = db.prepare('DELETE FROM tiles WHERE id = ?').run(id);
  if (!changes) return res.status(404).json({ message: 'Tile not found' });
  removeFiles(filenames);
  res.status(204).end();
});
