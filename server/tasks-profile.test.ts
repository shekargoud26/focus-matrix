import { describe, expect, it } from 'vitest';
import { authed, createTestApp, signupUser } from './test-utils.ts';

describe('tasks (US-8–15)', () => {
  it('create → list → quadrant filter (US-8,9)', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const c1 = await app.request('/api/tasks', {
      method: 'POST',
      headers: authed(cookie),
      body: JSON.stringify({ title: 'T1', quadrantId: 'inbox' }),
    });
    expect(c1.status).toBe(201);
    const created = (await c1.json()) as { completed: boolean; starred: boolean; closedAt: null };
    expect(created.completed).toBe(false);
    expect(created.starred).toBe(false);
    expect(created.closedAt).toBeNull();

    await app.request('/api/tasks', {
      method: 'POST',
      headers: authed(cookie),
      body: JSON.stringify({ title: 'T2', description: 'd', quadrantId: 'q1' }),
    });
    const list = (await (await app.request('/api/tasks', { headers: authed(cookie) })).json()) as unknown[];
    expect(list).toHaveLength(2);
    const inbox = (await (
      await app.request('/api/tasks?quadrant=inbox', { headers: authed(cookie) })
    ).json()) as unknown[];
    expect(inbox).toHaveLength(1);
  });

  it('move quadrant persists (US-10); star persists (US-12)', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const created = (await (
      await app.request('/api/tasks', {
        method: 'POST',
        headers: authed(cookie),
        body: JSON.stringify({ title: 'Move me', quadrantId: 'inbox' }),
      })
    ).json()) as { id: string };

    const moved = (await (
      await app.request(`/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: authed(cookie),
        body: JSON.stringify({ quadrantId: 'q2' }),
      })
    ).json()) as { quadrantId: string };
    expect(moved.quadrantId).toBe('q2');

    const starred = (await (
      await app.request(`/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: authed(cookie),
        body: JSON.stringify({ starred: true }),
      })
    ).json()) as { starred: boolean };
    expect(starred.starred).toBe(true);
  });

  it('complete sets closedAt, reopen clears it (US-11,14)', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const created = (await (
      await app.request('/api/tasks', {
        method: 'POST',
        headers: authed(cookie),
        body: JSON.stringify({ title: 'Do it', quadrantId: 'q1' }),
      })
    ).json()) as { id: string };

    const done = (await (
      await app.request(`/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: authed(cookie),
        body: JSON.stringify({ completed: true }),
      })
    ).json()) as { completed: boolean; closedAt: number };
    expect(done.completed).toBe(true);
    expect(typeof done.closedAt).toBe('number');

    const open = (await (
      await app.request(`/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: authed(cookie),
        body: JSON.stringify({ completed: false }),
      })
    ).json()) as { completed: boolean; closedAt: null };
    expect(open.completed).toBe(false);
    expect(open.closedAt).toBeNull();
  });

  it('direct closedAt edit for heatmap correction', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const created = (await (
      await app.request('/api/tasks', {
        method: 'POST',
        headers: authed(cookie),
        body: JSON.stringify({ title: 'Backdate', quadrantId: 'q1' }),
      })
    ).json()) as { id: string };
    const edited = (await (
      await app.request(`/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: authed(cookie),
        body: JSON.stringify({ closedAt: 1700000000000 }),
      })
    ).json()) as { closedAt: number };
    expect(edited.closedAt).toBe(1700000000000);
  });

  it('archive via completed + hard delete (US-13)', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const created = (await (
      await app.request('/api/tasks', {
        method: 'POST',
        headers: authed(cookie),
        body: JSON.stringify({ title: 'Old', quadrantId: 'q4' }),
      })
    ).json()) as { id: string };
    await app.request(`/api/tasks/${created.id}`, {
      method: 'PATCH',
      headers: authed(cookie),
      body: JSON.stringify({ completed: true }),
    });
    const archived = (await (
      await app.request('/api/tasks?completed=1', { headers: authed(cookie) })
    ).json()) as unknown[];
    expect(archived).toHaveLength(1);

    const del = await app.request(`/api/tasks/${created.id}`, { method: 'DELETE', headers: authed(cookie) });
    expect(del.status).toBe(200);
    const after = (await (await app.request('/api/tasks', { headers: authed(cookie) })).json()) as unknown[];
    expect(after).toHaveLength(0);
  });

  it('tenant isolation: B sees nothing, cross PATCH/DELETE → 404 (US-15)', async () => {
    const { app } = createTestApp();
    const a = await signupUser(app, { email: 'a@iso.com' });
    const b = await signupUser(app, { email: 'b@iso.com' });
    const created = (await (
      await app.request('/api/tasks', {
        method: 'POST',
        headers: authed(a.cookie),
        body: JSON.stringify({ title: 'Private', quadrantId: 'q1' }),
      })
    ).json()) as { id: string };

    const bList = (await (await app.request('/api/tasks', { headers: authed(b.cookie) })).json()) as unknown[];
    expect(bList).toHaveLength(0);
    expect(
      (
        await app.request(`/api/tasks/${created.id}`, {
          method: 'PATCH',
          headers: authed(b.cookie),
          body: JSON.stringify({ title: 'hijack' }),
        })
      ).status,
    ).toBe(404);
    expect(
      (await app.request(`/api/tasks/${created.id}`, { method: 'DELETE', headers: authed(b.cookie) })).status,
    ).toBe(404);
    // A still owns it
    const aList = (await (await app.request('/api/tasks', { headers: authed(a.cookie) })).json()) as unknown[];
    expect(aList).toHaveLength(1);
  });

  it('validation: bad quadrant / empty title → 400; unknown id → 404', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    expect(
      (
        await app.request('/api/tasks', {
          method: 'POST',
          headers: authed(cookie),
          body: JSON.stringify({ title: 'x', quadrantId: 'q9' }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request('/api/tasks', {
          method: 'POST',
          headers: authed(cookie),
          body: JSON.stringify({ title: '  ', quadrantId: 'q1' }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request('/api/tasks/does-not-exist', {
          method: 'PATCH',
          headers: authed(cookie),
          body: JSON.stringify({ title: 'y' }),
        })
      ).status,
    ).toBe(404);
  });
});

describe('profile (US-16,17)', () => {
  it('PUT → GET round-trip; auto-create on first GET', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app, { name: 'Siggy' });
    const first = (await (await app.request('/api/profile', { headers: authed(cookie) })).json()) as {
      name: string;
      title: string;
    };
    expect(first.name).toBe('Siggy');

    const put = await app.request('/api/profile', {
      method: 'PUT',
      headers: authed(cookie),
      body: JSON.stringify({ name: 'Siggy S', title: 'Maker' }),
    });
    expect(put.status).toBe(200);
    const get = (await (await app.request('/api/profile', { headers: authed(cookie) })).json()) as {
      name: string;
      title: string;
      updatedAt: number;
    };
    expect(get).toMatchObject({ name: 'Siggy S', title: 'Maker' });
    expect(typeof get.updatedAt).toBe('number');
  });

  it('oversize fields → 400', async () => {
    const { app } = createTestApp();
    const { cookie } = await signupUser(app);
    const badName = await app.request('/api/profile', {
      method: 'PUT',
      headers: authed(cookie),
      body: JSON.stringify({ name: 'x'.repeat(81) }),
    });
    expect(badName.status).toBe(400);
    const badTitle = await app.request('/api/profile', {
      method: 'PUT',
      headers: authed(cookie),
      body: JSON.stringify({ title: 'x'.repeat(121) }),
    });
    expect(badTitle.status).toBe(400);
  });
});
