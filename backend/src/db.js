import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.uploadsDir, { recursive: true });

export const db = new DatabaseSync(config.dbFile);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tiles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- position 0 is the "main" image shown on the dashboard.
  CREATE TABLE IF NOT EXISTS tile_images (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    tile_id  INTEGER NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    position INTEGER NOT NULL
  );
`);

// Seed the admin account (and keep its password in sync with config).
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get(config.admin.username);
const adminHash = bcrypt.hashSync(config.admin.password, 10);
if (admin) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(adminHash, admin.id);
} else {
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run(config.admin.username, adminHash);
}

/** Run fn inside a transaction. */
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
