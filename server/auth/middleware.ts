import type { Context, Next } from 'hono';
import type { Db } from '../db/index.ts';
import { findSessionUser, getSessionToken, type AuthedUser } from './session.ts';

export interface AppVars {
  db: Db;
  user: AuthedUser;
}

export async function requireAuth(c: Context<{ Variables: AppVars }>, next: Next): Promise<Response | void> {
  const db = c.get('db');
  const token = getSessionToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const user = await findSessionUser(db, token);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', user);
  await next();
}
