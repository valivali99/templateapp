import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export const authRouter = Router();

function toPublicUser(user) {
  return { id: user.id, username: user.username, role: user.role };
}

authRouter.post('/register', (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ message: 'Username must be 3-50 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ message: 'Username already taken' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')")
    .run(username, hash);
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(lastInsertRowid);

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
});

authRouter.post('/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  res.json(toPublicUser(user));
});
