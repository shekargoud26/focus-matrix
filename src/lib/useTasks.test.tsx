// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from './useTasks';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const serverTask = (over: Record<string, unknown> = {}) => ({
  id: 'srv-1',
  title: 'Server task',
  description: null,
  quadrantId: 'q1',
  completed: false,
  starred: false,
  position: 0,
  createdAt: 1700000000000,
  closedAt: null,
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTasks guest mode (US-18)', () => {
  it('writes every change to localStorage, no network', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() => useTasks('guest'));

    await act(async () => {
      await result.current.addTask('q1', 'Guest task', 'desc');
    });
    expect(result.current.tasks.some((t) => t.title === 'Guest task')).toBe(true);
    const stored = JSON.parse(localStorage.getItem('eisenhower-tasks') ?? '[]') as { title: string }[];
    expect(stored.some((t) => t.title === 'Guest task')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('seeds first-run guests', () => {
    const { result } = renderHook(() => useTasks('guest'));
    expect(result.current.tasks.length).toBeGreaterThan(5);
    expect(result.current.tasks.some((t) => t.id === 'seed-1')).toBe(true);
  });

  it('delete removes the task from state and localStorage', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchSpy);
    const { result } = renderHook(() => useTasks('guest'));
    const victim = result.current.tasks[0].id;

    await act(async () => {
      await result.current.deleteTask(victim);
    });
    expect(result.current.tasks.some((t) => t.id === victim)).toBe(false);
    const stored = JSON.parse(localStorage.getItem('eisenhower-tasks') ?? '[]') as { id: string }[];
    expect(stored.some((t) => t.id === victim)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('useTasks authed mode', () => {
  it('loads server truth on login', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (String(url).includes('/api/tasks')) return Promise.resolve(jsonResponse([serverTask()]));
      return Promise.resolve(jsonResponse({ error: 'unexpected' }, 500));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Server task');
  });

  it('optimistic quadrant move applies instantly and PATCHes', async () => {
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/api/tasks') && (!init || init.method === undefined || init.method === 'GET')) {
        return Promise.resolve(jsonResponse([serverTask()]));
      }
      calls.push({ url: String(url), body: String(init?.body) });
      return Promise.resolve(jsonResponse(serverTask({ quadrantId: 'q2' })));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveToQuadrant('srv-1', 'q2');
    });
    expect(result.current.tasks[0].quadrantId).toBe('q2');
    expect(calls.some((c) => c.body.includes('"quadrantId":"q2"'))).toBe(true);
  });

  it('rolls back optimistic move when PATCH fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (!init || init.method === undefined || init.method === 'GET') {
        return Promise.resolve(jsonResponse([serverTask()]));
      }
      return Promise.resolve(jsonResponse({ error: 'boom' }, 500));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.moveToQuadrant('srv-1', 'q3')).rejects.toBeTruthy();
    });
    expect(result.current.tasks[0].quadrantId).toBe('q1');
  });

  it('migrates real guest tasks once when server is empty', async () => {
    localStorage.setItem(
      'eisenhower-tasks',
      JSON.stringify([
        { id: 'local-1', title: 'Mine', quadrantId: 'q2', completed: false, createdAt: 1 },
        { id: 'seed-1', title: 'Seed', quadrantId: 'q1', completed: false, createdAt: 1 },
      ]),
    );
    const created: string[] = [];
    let listCalls = 0;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).endsWith('/api/tasks') && (!init?.method || init.method === 'GET')) {
        listCalls += 1;
        return Promise.resolve(jsonResponse(listCalls === 1 ? [] : [serverTask({ id: 'srv-2', title: 'Mine' })]));
      }
      if (init?.method === 'POST') {
        created.push(String(init.body));
        return Promise.resolve(jsonResponse(serverTask({ id: 'srv-2', title: 'Mine' }), 201));
      }
      return Promise.resolve(jsonResponse({ error: 'unexpected' }, 500));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(created).toHaveLength(1);
    expect(created[0]).toContain('Mine');
    expect(result.current.tasks.some((t) => t.title === 'Mine')).toBe(true);
  });

  it('delete removes from DB and purges both localStorage keys', async () => {
    localStorage.setItem(
      'eisenhower-tasks',
      JSON.stringify([{ id: 'srv-1', title: 'Server task', quadrantId: 'q1', completed: false, createdAt: 1 }]),
    );
    const deletes: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/api/tasks') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve(jsonResponse([serverTask()]));
      }
      if (init?.method === 'DELETE') {
        deletes.push(String(url));
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(jsonResponse({ error: 'unexpected' }, 500));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteTask('srv-1');
    });
    expect(deletes.some((u) => u.includes('/api/tasks/srv-1'))).toBe(true);
    expect(result.current.tasks.some((t) => t.id === 'srv-1')).toBe(false);
    for (const key of ['eisenhower-tasks', 'eisenhower-tasks-server-cache']) {
      const stored = JSON.parse(localStorage.getItem(key) ?? '[]') as { id: string }[];
      expect(stored.some((t) => t.id === 'srv-1')).toBe(false);
    }
  });

  it('delete of a local-only id (server 404) stays deleted, no rollback', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/api/tasks') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve(jsonResponse([serverTask({ id: 'local-1', title: 'Mine' })]));
      }
      if (init?.method === 'DELETE') {
        return Promise.resolve(jsonResponse({ error: 'not_found' }, 404));
      }
      return Promise.resolve(jsonResponse({ error: 'unexpected' }, 500));
    }));
    const { result } = renderHook(() => useTasks('authed'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteTask('local-1');
    });
    expect(result.current.tasks.some((t) => t.id === 'local-1')).toBe(false);
    const cache = JSON.parse(
      localStorage.getItem('eisenhower-tasks-server-cache') ?? '[]',
    ) as { id: string }[];
    expect(cache.some((t) => t.id === 'local-1')).toBe(false);
  });
});
