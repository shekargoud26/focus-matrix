import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { QuadrantId, Task } from '../types';
import { ApiError, api, toClient } from './api';
import { notifySessionExpired, type AuthMode } from './auth';
import { defaultSeedTasks, isSeedTask } from './seeds';

const GUEST_KEY = 'eisenhower-tasks';
const SERVER_CACHE_KEY = 'eisenhower-tasks-server-cache';

function loadGuestTasks(): Task[] {
  try {
    const saved = localStorage.getItem(GUEST_KEY);
    if (saved) return JSON.parse(saved) as Task[];
  } catch {
    // corrupted storage → reseed
  }
  return defaultSeedTasks();
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Task state with server sync. Guest mode is byte-identical to the legacy
 * App.tsx behavior (localStorage). Authed mode treats the server as truth
 * with optimistic updates + rollback, and mirrors to a separate cache key
 * so guest tasks are never clobbered.
 */
export function useTasks(mode: AuthMode) {
  const [tasks, setTasks] = useState<Task[]>(() => loadGuestTasks());
  const [loading, setLoading] = useState(mode === 'authed');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const migratedRef = useRef(false);
  const pendingSyncRef = useRef<Set<string>>(new Set());

  // Guest persistence (legacy behavior).
  useEffect(() => {
    if (modeRef.current !== 'guest') return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(tasks));
    } catch {
      // storage full/blocked → keep in-memory
    }
  }, [tasks]);

  // Authed: fetch server truth; one-time migrate real guest tasks if empty.
  useEffect(() => {
    if (mode !== 'authed') {
      // Back to guest → restore the untouched guest cache.
      setTasks(loadGuestTasks());
      setLoading(false);
      migratedRef.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let server = (await api.listTasks()).map(toClient);
        if (!migratedRef.current && server.length === 0) {
          migratedRef.current = true;
          const carry = loadGuestTasks().filter((t) => !isSeedTask(t) && !t.completed);
          for (const t of carry) {
            try {
              await api.createTask({ title: t.title, description: t.description, quadrantId: t.quadrantId });
            } catch {
              // keep going; user keeps local copies in guest key
            }
          }
          if (carry.length > 0) server = (await api.listTasks()).map(toClient);
        }
        if (cancelled) return;
        setTasks(server);
        try {
          localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(server));
        } catch {
          // ignore
        }
      } catch (e) {
        if (!cancelled) {
          // Expired session → prompt login; network failure → silent cache.
          if (e instanceof ApiError && e.status === 401) notifySessionExpired();
          else if (!(e instanceof ApiError)) console.warn('task sync failed, using cache', e);
          try {
            const cached = localStorage.getItem(SERVER_CACHE_KEY);
            if (cached) setTasks(JSON.parse(cached) as Task[]);
          } catch {
            // keep current
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const mutate = useCallback(
    async (optimistic: (prev: Task[]) => Task[], commit: (prev: Task[]) => Promise<unknown>) => {
      if (modeRef.current === 'guest') {
        setTasks(optimistic);
        return;
      }
      const prev = tasksRef.current;
      setTasks(optimistic);
      try {
        await commit(prev);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) notifySessionExpired();
        setTasks(prev);
        throw e;
      }
    },
    [],
  );

  const addTask = useCallback(
    async (quadrantId: QuadrantId, title: string, description: string) => {
      if (modeRef.current === 'guest') {
        const t: Task = { id: randomId(), title, description, quadrantId, completed: false, createdAt: Date.now(), starred: false };
        setTasks((prev) => [t, ...prev]);
        return;
      }
      const tempId = `tmp-${randomId()}`;
      const temp: Task = { id: tempId, title, description, quadrantId, completed: false, createdAt: Date.now(), starred: false };
      setTasks((prev) => [temp, ...prev]);
      try {
        const created = toClient(await api.createTask({ title, description, quadrantId }));
        setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) notifySessionExpired();
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        throw e;
      }
    },
    [],
  );

  const toggleTask = useCallback(
    (id: string) =>
      mutate(
        (prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: !t.completed, closedAt: !t.completed ? Date.now() : undefined } : t,
          ),
        (prev) => {
          const cur = prev.find((t) => t.id === id);
          return cur ? api.updateTask(id, { completed: !cur.completed }) : Promise.resolve();
        },
      ),
    [mutate],
  );

  const toggleStar = useCallback(
    (id: string) =>
      mutate(
        (prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
        (prev) => {
          const cur = prev.find((t) => t.id === id);
          return cur ? api.updateTask(id, { starred: !cur.starred }) : Promise.resolve();
        },
      ),
    [mutate],
  );

  const moveToQuadrant = useCallback(
    (id: string, quadrantId: QuadrantId) => {
      pendingSyncRef.current.delete(id);
      return mutate(
        (prev) => prev.map((t) => (t.id === id ? { ...t, quadrantId } : t)),
        () => api.updateTask(id, { quadrantId }),
      );
    },
    [mutate],
  );

  const editTask = useCallback(
    (id: string, title: string, description: string) =>
      mutate(
        (prev) => prev.map((t) => (t.id === id ? { ...t, title, description } : t)),
        () => api.updateTask(id, { title, description }),
      ),
    [mutate],
  );

  const updateTaskDate = useCallback(
    (id: string, newDate: number) =>
      mutate(
        (prev) => prev.map((t) => (t.id === id ? { ...t, closedAt: newDate } : t)),
        () => api.updateTask(id, { closedAt: newDate }),
      ),
    [mutate],
  );

  const deleteTask = useCallback(
    (id: string) =>
      mutate(
        (prev) => prev.filter((t) => t.id !== id),
        () => api.deleteTask(id),
      ),
    [mutate],
  );

  /** Restore tasks from a backup file. Merges by id (never deletes). Returns imported count. */
  const importTasks = useCallback(async (incoming: Task[]): Promise<number> => {
    const fresh = incoming.filter((t) => !tasksRef.current.some((e) => e.id === t.id));
    if (fresh.length === 0) return 0;
    if (modeRef.current === 'guest') {
      setTasks((prev) => [...fresh, ...prev]);
      return fresh.length;
    }
    // Authed: persist each missing task, then converge with returned ids.
    const created: Task[] = [];
    for (const t of fresh) {
      const srv = toClient(await api.createTask({ title: t.title, description: t.description, quadrantId: t.quadrantId }));
      const patch: Record<string, unknown> = {};
      if (t.completed) patch.completed = true;
      if (t.starred) patch.starred = true;
      if (t.closedAt) patch.closedAt = t.closedAt;
      const final = Object.keys(patch).length > 0 ? toClient(await api.updateTask(srv.id, patch as never)) : srv;
      created.push(final);
    }
    setTasks((prev) => [...created, ...prev]);
    return created.length;
  }, []);

  /** Local-only quadrant change during drag-over (persisted on drop). */
  const moveLocal = useCallback((id: string, quadrantId: QuadrantId) => {
    pendingSyncRef.current.add(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, quadrantId } : t)));
  }, []);

  /** Local-only reorder during drag-over (persisted on drop). */
  const reorderLocal = useCallback((activeId: string, overId: string) => {
    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      const [lo, hi] = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
      for (let i = lo; i <= hi; i++) pendingSyncRef.current.add(prev[i].id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  /** Flush drag-time local changes (quadrant + positions) to the server. */
  const commitDrag = useCallback(async () => {
    const ids = [...pendingSyncRef.current];
    pendingSyncRef.current.clear();
    if (modeRef.current === 'guest' || ids.length === 0) return;
    const snapshot = tasksRef.current;
    try {
      await Promise.all(
        ids.map((id) => {
          const idx = snapshot.findIndex((t) => t.id === id);
          const t = snapshot[idx];
          if (!t || t.id.startsWith('tmp-')) return Promise.resolve();
          return api.updateTask(id, { quadrantId: t.quadrantId, position: idx });
        }),
      );
    } catch (e) {
      // Converge with server truth on failure.
      if (e instanceof ApiError && e.status === 401) notifySessionExpired();
      try {
        setTasks((await api.listTasks()).map(toClient));
      } catch {
        // keep local
      }
      throw e;
    }
  }, []);

  return {
    tasks,
    loading,
    addTask,
    toggleTask,
    toggleStar,
    moveToQuadrant,
    editTask,
    updateTaskDate,
    deleteTask,
    importTasks,
    moveLocal,
    reorderLocal,
    commitDrag,
  };
}

export type TasksApi = ReturnType<typeof useTasks>;
