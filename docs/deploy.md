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

### Pages + D1 (API on the same Pages domain — recommended for Pages sites)

`functions/api/[[route]].ts` mounts the same Hono app as a Pages Function,
so `/api/*` works same-origin (cookies included) with zero CORS setup.
Keep `VITE_API_URL` empty/unset on the Pages project — any other value
bypasses the Function and hits a different origin (cookies break).

One-time setup (needs a Cloudflare account with D1):

```bash
npx wrangler d1 create focus-matrix   # BLOCKING: copy the real id over the
                                      # "placeholder-..." database_id in wrangler.toml first
npx wrangler d1 migrations apply focus-matrix --remote
```

The D1 binding comes from `wrangler.toml` (`[[d1_databases]]` with
`binding = "DB"`) — the file is the source of truth, no dashboard step
needed. (Alternative without wrangler: Pages dashboard → project →
Settings → Bindings → Add D1, variable `DB` — use one method, not both.)
Without a resolvable binding, `/api/*` returns
`503 {error:'database_not_configured'}`.
Redeploy after setup (Retry deployment) so the Function picks it up.

### Closing registration

Set `DISABLE_SIGNUPS=true` to return `403 {error:'signups_disabled'}` on
`POST /api/auth/signup` — existing users can still log in. Sources checked
in order: worker/pages env binding, then `process.env` (VPS/Docker):

- VPS/Docker: `DISABLE_SIGNUPS=true` in the environment.
- Cloudflare: `[vars] DISABLE_SIGNUPS = "true"` in the wrangler file or a
  dashboard variable of the same name.
- The login modal hides the signup tab automatically via
  `GET /api/auth/config`.

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
