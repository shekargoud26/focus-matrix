import { Hono } from 'hono';
import type { Db } from './db/index.ts';
import { authRoutes, type AuthVars } from './routes/auth.ts';
import { taskRoutes } from './routes/tasks.ts';
import { profileRoutes } from './routes/profile.ts';

export interface AppEnv {
  Bindings: { DB?: unknown; DISABLE_SIGNUPS?: string };
  Variables: AuthVars;
}

/** Portable app factory — no env binding inside, entries inject the db. */
export function createApp(db: Db): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('db', db);
    await next();
  });
  app.route('/api/auth', authRoutes);
  app.route('/api/tasks', taskRoutes);
  app.route('/api/profile', profileRoutes);
  app.get('/api/health', (c) => c.json({ ok: true }));
  return app;
}
