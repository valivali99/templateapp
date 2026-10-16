import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  // Override JWT_SECRET in any real deployment.
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  dataDir: path.join(rootDir, 'data'),
  dbFile: path.join(rootDir, 'data', 'app.db'),
  uploadsDir: path.join(rootDir, 'uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  admin: {
    username: process.env.ADMIN_USERNAME || 'adminusername',
    password: process.env.ADMIN_PASSWORD || 'adminpassword',
  },
};
