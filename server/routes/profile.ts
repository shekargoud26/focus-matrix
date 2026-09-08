import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { profiles } from '../db/schema.ts';
import { requireAuth, type AppVars } from '../auth/middleware.ts';

export const profileRoutes = new Hono<{ Variables: AppVars }>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const db: Db = c.get('db');
    const user = c.get('user');
    const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const row = rows[0];
    if (!row) {
      const now = Date.now();
      await db.insert(profiles).values({ userId: user.id, name: user.name, title: '', updatedAt: now });
      return c.json({ name: user.name, title: '', updatedAt: now }, 200);
    }
    return c.json({ name: row.name ?? '', title: row.title ?? '', updatedAt: row.updatedAt }, 200);
  })
  .put('/', async (c) => {
    const db: Db = c.get('db');
    const user = c.get('user');
    let body: { name?: unknown; title?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_input', fields: { body: 'must be valid JSON' } }, 400);
    }
    const fields: Record<string, string> = {};
    let name: string | undefined;
    let title: string | undefined;
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') fields.name = 'must be a string';
      else if (body.name.trim().length > 80) fields.name = 'must be at most 80 characters';
      else name = body.name.trim();
    }
    if (body.title !== undefined) {
      if (typeof body.title !== 'string') fields.title = 'must be a string';
      else if (body.title.trim().length > 120) fields.title = 'must be at most 120 characters';
      else title = body.title.trim();
    }
    if (Object.keys(fields).length > 0) return c.json({ error: 'invalid_input', fields }, 400);

    const now = Date.now();
    const existing = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(profiles).values({ userId: user.id, name: name ?? user.name, title: title ?? '', updatedAt: now });
    } else {
      const set: Partial<typeof profiles.$inferInsert> = { updatedAt: now };
      if (name !== undefined) set.name = name;
      if (title !== undefined) set.title = title;
      await db.update(profiles).set(set).where(eq(profiles.userId, user.id));
    }
    const updated = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const row = updated[0];
    return c.json({ name: row.name ?? '', title: row.title ?? '', updatedAt: row.updatedAt }, 200);
  });
