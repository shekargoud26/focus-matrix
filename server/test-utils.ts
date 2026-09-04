import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db/schema.ts';
import { createApp } from './app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));

/** Fresh app + migrated :memory: DB. No ports, no network, no mocks. */
export function createTestApp() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const sql = readFileSync(resolve(here, '../drizzle/0000_freezing_ozymandias.sql'), 'utf8');
  for (const stmt of sql.split('--> statement-breakpoint')) {
    if (stmt.trim()) sqlite.exec(stmt);
  }
  const db = drizzle(sqlite, { schema });
  return { app: createApp(db), sqlite };
}

export function sessionCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/session=[^;]*/);
  if (!match) throw new Error(`no session cookie in response: ${setCookie}`);
  return match[0];
}

export async function signupUser(
  app: ReturnType<typeof createApp>,
  overrides: { email?: string; password?: string; name?: string } = {},
) {
  const n = Math.random().toString(36).slice(2, 8);
  const res = await app.request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: overrides.email ?? `user-${n}@test.com`,
      password: overrides.password ?? 'password123',
      name: overrides.name ?? `User ${n}`,
    }),
  });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${await res.text()}`);
  return { status: res.status, cookie: sessionCookie(res), body: (await res.json()) as { id: string; email: string; name: string } };
}

export function authed(cookie: string) {
  return { 'Content-Type': 'application/json', cookie };
}
