import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from './config.js';
import './db.js';
import { authRouter } from './routes/auth.js';
import { tilesRouter } from './routes/tiles.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/uploads', express.static(config.uploadsDir, { maxAge: '7d' }));
app.use('/api/auth', authRouter);
app.use('/api/tiles', tilesRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
