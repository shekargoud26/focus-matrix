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

## Cloudflare

Two targets share the same backend code but need separate configs, because
a Pages project config (`wrangler.toml`) cannot contain the Workers `main`
key and vice versa.

### Pages (frontend, auto-build on push)

`wrangler.toml` (`pages_build_output_dir = "dist"`) is picked up
automatically by the Pages build. No `main` key — Pages rejects it.

### Workers + D1 (API + frontend static assets in one Worker)

```bash
npx wrangler d1 create focus-matrix   # copy id into wrangler.workers.toml
npx wrangler d1 migrations apply focus-matrix --local
npx wrangler d1 migrations apply focus-matrix --remote
npx wrangler deploy --config wrangler.workers.toml
```

- Entry: `server/index.workers.ts` → `createApp(createD1Db(env.DB))`.
- The Workers bundle never includes `better-sqlite3`/`node:*`: node-only code
  is isolated in `server/db/local.ts`, edge-safe code in
  `server/db/d1.ts` + `server/db/index.ts` (types only).
- `dist/` is served as Workers Static Assets (`[assets]` in
  `wrangler.workers.toml`, SPA fallback on); `/api/*` is handled by Hono.
