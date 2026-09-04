import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/index.ts';
import { sessions, users } from '../db/schema.ts';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
}

export function createSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = btoa(s);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function cookieSecureDefault(c: Context): boolean {
  const explicit =
    typeof process !== 'undefined' ? process.env?.SESSION_COOKIE_SECURE : (c.env as any)?.SESSION_COOKIE_SECURE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  try {
    const host = new URL(c.req.url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return true;
  }
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: cookieSecureDefault(c),
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function getSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

export async function createSession(db: Db, userId: string): Promise<string> {
  const token = createSessionToken();
  await db.insert(sessions).values({ id: token, userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, token));
}

export async function findSessionUser(db: Db, token: string): Promise<AuthedUser | null> {
  const rows = await db
    .select({ token: sessions.id, expiresAt: sessions.expiresAt, id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    await deleteSession(db, token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}
