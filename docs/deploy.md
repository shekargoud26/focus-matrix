# Deploy

Same backend codebase (`server/app.ts` route handlers) runs on both targets —
only the one-line entry differs. No handler edits when switching targets.

## VPS (Docker, local SQLite)

```bash
docker build -t focus-matrix .
docker run --rm -p 8788:8788 -v focus-matrix-data:/data focus-matrix
```

- Serves API (`/api/*`) + built frontend from `./dist` on `:8788`.
- SQLite file at `SQLITE_PATH` (`/data/sqlite.db` in container, `./data/sqlite.db`
  locally). Migrations from `./drizzle` run automatically on boot.
- Local dev: `npm run server:dev` (API :8788) + `npm run dev` (Vite :3000,
  `/api` proxied). Fresh DB: `rm -f data/sqlite.db && npm run db:migrate`.

## Cloudflare (Workers + D1)

```bash
npx wrangler d1 create focus-matrix   # copy id into wrangler.toml
npx wrangler d1 migrations apply focus-matrix --local
npx wrangler d1 migrations apply focus-matrix --remote
npx wrangler deploy
```

- Entry: `server/index.workers.ts` → `createApp(createD1Db(env.DB))`.
- The Workers bundle never includes `better-sqlite3`/`node:*`: node-only code
  is isolated in `server/db/local.ts`, edge-safe code in
  `server/db/d1.ts` + `server/db/index.ts` (types only).
- Frontend `dist/` deploys via Pages / Workers Static Assets per `wrangler.toml`.
