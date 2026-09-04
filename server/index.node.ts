import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.ts';
import { createLocalDb, runLocalMigrations } from './db/local.ts';

const port = Number(process.env.PORT ?? 8788);
const dbPath = runLocalMigrations();
const app = createApp(createLocalDb());

// Single-port VPS mode: API under /api/*, built Vite frontend from ./dist.
// ORDER MATTERS: real API routes were registered first inside createApp(), so
// they win; this 404 must stay AFTER createApp() and BEFORE serveStatic,
// otherwise unknown /api/* paths would serve index.html (SPA fallback).
app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
app.use('/*', serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`focus-matrix listening on :${info.port}, db=${dbPath}`);
});
