import type { Profile, QuadrantId, Task } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export interface ServerTask {
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

export function toClient(t: ServerTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    quadrantId: t.quadrantId,
    completed: t.completed,
    starred: t.starred || undefined,
    position: t.position,
    createdAt: t.createdAt,
    closedAt: t.closedAt ?? undefined,
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const api = {
  signup: (input: { email: string; password: string; name: string }) =>
    req<AuthUser>('/api/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    req<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => req<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => req<AuthUser>('/api/auth/me'),

  listTasks: (filters?: { quadrant?: QuadrantId; completed?: 0 | 1 }) => {
    const q = new URLSearchParams();
    if (filters?.quadrant) q.set('quadrant', filters.quadrant);
    if (filters?.completed !== undefined) q.set('completed', String(filters.completed));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return req<ServerTask[]>(`/api/tasks${suffix}`);
  },
  createTask: (input: { title: string; description?: string; quadrantId: QuadrantId }) =>
    req<ServerTask>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (id: string, patch: Partial<Pick<ServerTask, 'title' | 'description' | 'quadrantId' | 'completed' | 'starred' | 'position' | 'closedAt'>>) =>
    req<ServerTask>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTask: (id: string) =>
    req<{ ok: true }>(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getProfile: () => req<{ name: string; title: string; updatedAt: number | null }>('/api/profile'),
  updateProfile: (input: { name?: string; title?: string }) =>
    req<{ name: string; title: string; updatedAt: number | null }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
};

export type { Profile };
