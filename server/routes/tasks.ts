import { Hono } from 'hono';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { QUADRANT_IDS, tasks, type QuadrantId } from '../db/schema.ts';
import { requireAuth, type AppVars } from '../auth/middleware.ts';

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  quadrantId: QuadrantId;
  completed: boolean;
  starred: boolean;
  position: number;
  createdAt: number;
  closedAt: number | null;
}

function toDTO(r: typeof tasks.$inferSelect): TaskDTO {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    quadrantId: r.quadrantId,
    completed: r.completed === 1,
    starred: r.starred === 1,
    position: r.position,
    createdAt: r.createdAt,
    closedAt: r.closedAt,
  };
}

function isQuadrant(v: unknown): v is QuadrantId {
  return typeof v === 'string' && (QUADRANT_IDS as readonly string[]).includes(v);
}

async function nextPosition(db: Db, userId: string): Promise<number> {
  const all = await db.select({ position: tasks.position }).from(tasks).where(eq(tasks.userId, userId));
  let m = -1;
  for (const r of all) if (r.position > m) m = r.position;
  return m + 1;
}

export const taskRoutes = new Hono<{ Variables: AppVars }>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    const quadrant = c.req.query('quadrant');
    const completedQ = c.req.query('completed');
    if (quadrant !== undefined && !isQuadrant(quadrant)) {
      return c.json({ error: 'invalid_input', fields: { quadrant: 'must be one of q1|q2|q3|q4|inbox' } }, 400);
    }
    if (completedQ !== undefined && completedQ !== '0' && completedQ !== '1') {
      return c.json({ error: 'invalid_input', fields: { completed: 'must be 0 or 1' } }, 400);
    }
    const conds = [eq(tasks.userId, user.id)];
    if (quadrant !== undefined) conds.push(eq(tasks.quadrantId, quadrant as QuadrantId));
    if (completedQ !== undefined) conds.push(eq(tasks.completed, Number(completedQ)));
    const rows = await db
      .select()
      .from(tasks)
      .where(and(...conds))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
    return c.json(rows.map(toDTO), 200);
  })
  .post('/', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    let body: { title?: unknown; description?: unknown; quadrantId?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_input', fields: { body: 'must be valid JSON' } }, 400);
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description =
      body.description === undefined || body.description === null
        ? null
        : typeof body.description === 'string'
          ? body.description
          : undefined;
    const quadrantId = body.quadrantId;
    const fields: Record<string, string> = {};
    if (title.length < 1) fields.title = 'is required';
    if (title.length > 200) fields.title = 'must be at most 200 characters';
    if (description === undefined) fields.description = 'must be a string or null';
    if (!isQuadrant(quadrantId)) fields.quadrantId = 'must be one of q1|q2|q3|q4|inbox';
    if (Object.keys(fields).length > 0) return c.json({ error: 'invalid_input', fields }, 400);

    const now = Date.now();
    const id = crypto.randomUUID();
    await db.insert(tasks).values({
      id,
      userId: user.id,
      title,
      description,
      quadrantId: quadrantId as QuadrantId,
      completed: 0,
      starred: 0,
      position: await nextPosition(db, user.id),
      createdAt: now,
      closedAt: null,
    });
    const rows = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id))).limit(1);
    return c.json(toDTO(rows[0]), 201);
  })
  .patch('/:id', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    const id = c.req.param('id');
    let body: {
      title?: unknown;
      description?: unknown;
      quadrantId?: unknown;
      completed?: unknown;
      starred?: unknown;
      position?: unknown;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_input', fields: { body: 'must be valid JSON' } }, 400);
    }
    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);
    const row = existing[0];
    if (!row) return c.json({ error: 'not_found' }, 404);

    const patch: Partial<typeof tasks.$inferInsert> = {};
    const fields: Record<string, string> = {};
    if (body.title !== undefined) {
      const t = typeof body.title === 'string' ? body.title.trim() : '';
      if (t.length < 1 || t.length > 200) fields.title = 'must be 1..200 characters';
      else patch.title = t;
    }
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        fields.description = 'must be a string or null';
      } else patch.description = body.description as string | null;
    }
    if (body.quadrantId !== undefined) {
      if (!isQuadrant(body.quadrantId)) fields.quadrantId = 'must be one of q1|q2|q3|q4|inbox';
      else patch.quadrantId = body.quadrantId;
    }
    let completedBool: boolean | undefined;
    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') fields.completed = 'must be a boolean';
      else completedBool = body.completed;
    }
    // Direct closedAt editing (heatmap date correction). Independent of the
    // completed toggle above; explicit value wins when both are sent.
    let closedAtSet = false;
    let closedAtVal: number | null = null;
    if ((body as Record<string, unknown>).closedAt !== undefined) {
      const v = (body as Record<string, unknown>).closedAt;
      if (v !== null && (typeof v !== 'number' || !Number.isInteger(v) || v < 0)) {
        fields.closedAt = 'must be an integer timestamp or null';
      } else {
        closedAtSet = true;
        closedAtVal = v as number | null;
      }
    }
    if (body.starred !== undefined) {
      if (typeof body.starred !== 'boolean') fields.starred = 'must be a boolean';
      else patch.starred = body.starred ? 1 : 0;
    }
    if (body.position !== undefined) {
      if (typeof body.position !== 'number' || !Number.isInteger(body.position)) {
        fields.position = 'must be an integer';
      } else patch.position = body.position;
    }
    if (Object.keys(fields).length > 0) return c.json({ error: 'invalid_input', fields }, 400);

    if (completedBool !== undefined) {
      const was = row.completed === 1;
      patch.completed = completedBool ? 1 : 0;
      if (completedBool && !was) patch.closedAt = Date.now();
      if (!completedBool && was) patch.closedAt = null;
    }
    if (closedAtSet) patch.closedAt = closedAtVal;
    if (Object.keys(patch).length > 0) {
      await db.update(tasks).set(patch).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
    }
    const updated = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);
    return c.json(toDTO(updated[0]), 200);
  })
  .delete('/:id', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    const id = c.req.param('id');
    const existing = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);
    if (existing.length === 0) return c.json({ error: 'not_found' }, 404);
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
    return c.json({ ok: true }, 200);
  });
