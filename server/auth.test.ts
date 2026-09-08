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

  it('DISABLE_SIGNUPS closes registration but login still works', async () => {
    const { app } = createTestApp();
    const env = { DISABLE_SIGNUPS: 'true' };

    const config = (await (
      await app.request('/api/auth/config', { headers: J }, env)
    ).json()) as { signupsDisabled: boolean };
    expect(config).toEqual({ signupsDisabled: true });

    const blocked = await app.request(
      '/api/auth/signup',
      { method: 'POST', headers: J, body: JSON.stringify({ email: 'new@test.com', password: 'password123', name: 'New' }) },
      env,
    );
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toEqual({ error: 'signups_disabled' });

    // Gate runs before validation: garbage body is still 403, not 400.
    const blockedInvalid = await app.request(
      '/api/auth/signup',
      { method: 'POST', headers: J, body: 'not-json' },
      env,
    );
    expect(blockedInvalid.status).toBe(403);

    // Pre-existing user can still log in, use /me and log out.
    await signupUser(app, { email: 'old@test.com', password: 'password123' });
    const login = await app.request(
      '/api/auth/login',
      { method: 'POST', headers: J, body: JSON.stringify({ email: 'old@test.com', password: 'password123' }) },
      env,
    );
    expect(login.status).toBe(200);
    const cookie = (login.headers.get('set-cookie') ?? '').match(/session=[^;]*/)?.[0] ?? '';
    expect((await app.request('/api/auth/me', { headers: { cookie } }, env)).status).toBe(200);
    expect((await app.request('/api/auth/logout', { method: 'POST', headers: { cookie } }, env)).status).toBe(200);
  });

  it('DISABLE_SIGNUPS reads process.env fallback and truthy variants', async () => {
    const { app } = createTestApp();
    const saved = process.env.DISABLE_SIGNUPS;
    try {
      for (const v of ['1', 'yes', 'TRUE']) {
        process.env.DISABLE_SIGNUPS = v;
        const res = await app.request('/api/auth/signup', {
          method: 'POST',
          headers: J,
          body: JSON.stringify({ email: `x-${v}@test.com`, password: 'password123', name: 'X' }),
        });
        expect(res.status).toBe(403);
      }
      // Binding takes precedence over process.env: binding 'false' wins
      // even when the process env says 'true'.
      process.env.DISABLE_SIGNUPS = 'true';
      const open = await app.request(
        '/api/auth/signup',
        { method: 'POST', headers: J, body: JSON.stringify({ email: 'open@test.com', password: 'password123', name: 'Open' }) },
        { DISABLE_SIGNUPS: 'false' },
      );
      expect(open.status).toBe(201);
    } finally {
      if (saved === undefined) delete process.env.DISABLE_SIGNUPS;
      else process.env.DISABLE_SIGNUPS = saved;
    }
  });

  it('/api/auth/config reports open by default', async () => {
    const saved = process.env.DISABLE_SIGNUPS;
    delete process.env.DISABLE_SIGNUPS;
    try {
      const { app } = createTestApp();
      const config = (await (await app.request('/api/auth/config')).json()) as { signupsDisabled: boolean };
      expect(config).toEqual({ signupsDisabled: false });
    } finally {
      if (saved !== undefined) process.env.DISABLE_SIGNUPS = saved;
    }
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

  it('hash iteration count stays within the Workers PBKDF2 cap (100k)', async () => {
    // Cloudflare rejects PBKDF2 counts above 100000 with NotSupportedError,
    // which turned every signup into an HTTP 500 on Pages/Workers.
    const iterations = Number((await hashPassword('password123')).split('$')[1]);
    expect(Number.isInteger(iterations)).toBe(true);
    expect(iterations).toBeLessThanOrEqual(100_000);
  });

  it('unhandled route errors → JSON 500 {error:internal}, not plain text', async () => {
    const { app } = createTestApp();
    app.get('/api/__boom__', () => {
      throw new Error('boom');
    });
    const res = await app.request('/api/__boom__');
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ error: 'internal' });
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
