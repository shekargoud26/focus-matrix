import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './auth/hash.ts';
import { authed, createTestApp, sessionCookie, signupUser } from './test-utils.ts';

const J = { 'Content-Type': 'application/json' };

describe('auth (US-1–7)', () => {
  it('signup → 201 + HttpOnly session cookie; /me works (US-1,3)', async () => {
    const { app } = createTestApp();
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: J,
      body: JSON.stringify({ email: 'A@Test.com ', password: 'password123', name: ' Alice ' }),
    });
    expect(res.status).toBe(201);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('session=');
    expect(setCookie).toContain('HttpOnly');
    const body = (await res.json()) as { email: string; name: string };
    expect(body.email).toBe('a@test.com');
    expect(body.name).toBe('Alice');

    const me = await app.request('/api/auth/me', { headers: { cookie: sessionCookie(res) } });
    expect(me.status).toBe(200);
  });

  it('duplicate email → 409 email_taken (US-7)', async () => {
    const { app } = createTestApp();
    await signupUser(app, { email: 'dup@test.com' });
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: J,
      body: JSON.stringify({ email: 'dup@test.com', password: 'password123', name: 'Dup' }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'email_taken' });
  });

  it('login wrong pw → 401 no cookie; right pw → 200 + cookie (US-2)', async () => {
    const { app } = createTestApp();
    await signupUser(app, { email: 'login@test.com', password: 'password123' });
    const bad = await app.request('/api/auth/login', {
      method: 'POST',
      headers: J,
      body: JSON.stringify({ email: 'login@test.com', password: 'wrongpass1' }),
    });
    expect(bad.status).toBe(401);
    expect(bad.headers.get('set-cookie')).toBeNull();
    expect(await bad.json()).toEqual({ error: 'invalid_credentials' });

    const good = await app.request('/api/auth/login', {
      method: 'POST',
      headers: J,
      body: JSON.stringify({ email: 'login@test.com', password: 'password123' }),
    });
    expect(good.status).toBe(200);
    expect(good.headers.get('set-cookie')).toContain('session=');
  });

  it('anon /me → 401 unauthorized (US-5); logout clears session (US-4)', async () => {
    const { app, sqlite } = createTestApp();
    const anon = await app.request('/api/auth/me');
    expect(anon.status).toBe(401);
    expect(await anon.json()).toEqual({ error: 'unauthorized' });

    const { cookie, body } = await signupUser(app);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?').get(body.id) as { n: number }).toMatchObject({ n: 1 });
    const out = await app.request('/api/auth/logout', { method: 'POST', headers: { cookie } });
    expect(out.status).toBe(200);
    // Cookie cleared + server row deleted.
    expect(out.headers.get('set-cookie') ?? '').toMatch(/session=;.*Max-Age=0/);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?').get(body.id) as { n: number }).toMatchObject({ n: 0 });
    const after = await app.request('/api/auth/me', { headers: { cookie } });
    expect(after.status).toBe(401);
  });

  it('validation → 400 invalid_input; short password rejected', async () => {
    const { app } = createTestApp();
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: J,
      body: JSON.stringify({ email: 'not-an-email', password: 'short', name: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_input');
  });

  it('passwords are PBKDF2-hashed, verify true/false, malformed false (US-6)', async () => {
    const hash = await hashPassword('password123');
    expect(hash.startsWith('pbkdf2$')).toBe(true);
    expect(hash).not.toContain('password123');
    expect(await verifyPassword('password123', hash)).toBe(true);
    expect(await verifyPassword('wrongpass1', hash)).toBe(false);
    expect(await verifyPassword('password123', 'garbage')).toBe(false);
  });

  it('authed task routes reject anonymous callers (US-5)', async () => {
    const { app } = createTestApp();
    expect((await app.request('/api/tasks')).status).toBe(401);
    expect((await app.request('/api/profile')).status).toBe(401);
    expect(
      (await app.request('/api/tasks', { method: 'POST', headers: J, body: '{}' })).status,
    ).toBe(401);
  });

  it('expired session → 401', async () => {
    const { app, sqlite } = createTestApp();
    const { cookie, body } = await signupUser(app);
    // Force-expire the session row directly.
    sqlite.exec(`UPDATE sessions SET expires_at = 1 WHERE user_id = '${body.id}'`);
    const me = await app.request('/api/auth/me', { headers: { cookie } });
    expect(me.status).toBe(401);
    expect((await app.request('/api/tasks', { headers: authed(cookie) })).status).toBe(401);
  });
});
