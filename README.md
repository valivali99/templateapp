# Template App

Starter app: Angular 19 + Angular Material frontend, Node/Express backend, SQLite database, JWT auth with two roles.

```
templateapp/
├── backend/    Express API (port 3000) — SQLite file in backend/data, uploaded images in backend/uploads
└── template/   Angular app (port 4200) — proxies /api and /uploads to the backend
```

## Run it

Requires **Node 22.13+** (the database uses the built-in `node:sqlite` module, so there is nothing native to compile).

```bash
npm run install:all
npm run dev
```

Open http://localhost:4200.

- **Admin:** `adminusername` / `adminpassword` (created automatically on startup)
- **Normal users:** create one on the Sign up page

To start from a clean database, stop the server and delete `backend/data` and `backend/uploads`.

## Features

- Login and sign-up pages; JWT stored in `localStorage` and sent as `Authorization: Bearer …`
- Roles: guests and `user` accounts can browse tiles; `admin` can create / edit / delete them
- Dashboard of tiles (name, description, images); the first image is the "main" one shown on the tile
- Detail page with an image carousel (arrows, dots, thumbnails, keyboard, swipe)
- Admin editor: upload up to 10 images (5 MB each), reorder, set main, remove

## Configuration (backend environment variables)

| Variable | Default |
|---|---|
| `PORT` | `3000` |
| `JWT_SECRET` | `dev-secret-change-me` — **change in production** |
| `JWT_EXPIRES_IN` | `8h` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `adminusername` / `adminpassword` |
| `CORS_ORIGIN` | `http://localhost:4200` |

## API

`GET /api/tiles` routes are public; POST / PUT / DELETE need an admin token.

| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/register` | `{ username, password }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ username, password }` → `{ token, user }` |
| GET | `/api/auth/me` | — |
| GET | `/api/tiles` | — |
| GET | `/api/tiles/:id` | — |
| POST | `/api/tiles` | multipart: `name`, `description`, `images[]` |
| PUT | `/api/tiles/:id` | multipart: `name`, `description`, `images[]`, `order` (JSON, e.g. `["existing:4","new:0"]`) |
| DELETE | `/api/tiles/:id` | — |

## Reusing as a template

- Frontend auth lives in `template/src/app/core` (service, interceptor, guards); add pages under `pages/` and routes in `app.routes.ts` behind `authGuard` / `adminGuard`.
- Backend: add a router in `backend/src/routes`, protect it with `requireAuth` / `requireAdmin`, add tables in `backend/src/db.js`.
- SSR is set up, but every route renders on the client (`app.routes.server.ts`) because pages depend on the token stored in the browser.
