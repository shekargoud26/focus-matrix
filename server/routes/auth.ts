import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { profiles, users } from '../db/schema.ts';
import { hashPassword, verifyPassword } from '../auth/hash.ts';
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionToken,
  setSessionCookie,
  signupsDisabled,
  type AuthedUser,
} from '../auth/session.ts';
import { requireAuth } from '../auth/middleware.ts';

export interface AuthVars {
  db: Db;
  user: AuthedUser;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidInput(c: any, fields: Record<string, string>) {
  return c.json({ error: 'invalid_input', fields }, 400);
}

export const authRoutes = new Hono<{ Variables: AuthVars }>()
  .get('/config', async (c) => {
    return c.json({ signupsDisabled: signupsDisabled(c) }, 200);
  })
  .post('/signup', async (c) => {
    if (signupsDisabled(c)) return c.json({ error: 'signups_disabled' }, 403);
    const db = c.get('db');
    let body: { email?: unknown; password?: unknown; name?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return invalidInput(c, { body: 'must be valid JSON' });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    const fields: Record<string, string> = {};
    if (!EMAIL_RE.test(email)) fields.email = 'must be a valid email';
    if (password.length < 8) fields.password = 'must be at least 8 characters';
    if (name.length < 1) fields.name = 'is required';
    if (name.length > 80) fields.name = 'must be at most 80 characters';
    if (Object.keys(fields).length > 0) return invalidInput(c, fields);

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return c.json({ error: 'email_taken' }, 409);

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ id, email, passwordHash, name, createdAt: Date.now() });
    await db.insert(profiles).values({ userId: id, name, title: '', updatedAt: Date.now() });

    const token = await createSession(db, id);
    setSessionCookie(c, token);
    return c.json({ id, email, name }, 201);
  })
  .post('/login', async (c) => {
    const db = c.get('db');
    let body: { email?: unknown; password?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return invalidInput(c, { body: 'must be valid JSON' });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return invalidInput(c, { email: 'required', password: 'required' });

    const rows = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: 'invalid_credentials' }, 401);
    }
    const token = await createSession(db, user.id);
    setSessionCookie(c, token);
    return c.json({ id: user.id, email: user.email, name: user.name }, 200);
  })
  .post('/logout', async (c) => {
    const db = c.get('db');
    const token = getSessionToken(c);
    if (token) await deleteSession(db, token);
    clearSessionCookie(c);
    return c.json({ ok: true }, 200);
  })
  .get('/me', requireAuth, async (c) => {
    const user = c.get('user');
    return c.json({ id: user.id, email: user.email, name: user.name }, 200);
  });
