import type { Profile, QuadrantId, Task } from '../types';

const VALID_QUADRANTS: QuadrantId[] = ['q1', 'q2', 'q3', 'q4', 'inbox'];

export interface BackupFile {
  app: 'focus-matrix';
  version: 1;
  exportedAt: number;
  profile: Profile;
  tasks: Task[];
}

export function buildBackup(tasks: Task[], profile: Profile): BackupFile {
  return { app: 'focus-matrix', version: 1, exportedAt: Date.now(), profile, tasks };
}

function sanitizeTask(t: unknown): Task | null {
  if (!t || typeof t !== 'object') return null;
  const r = t as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string') return null;
  const quadrantId = VALID_QUADRANTS.includes(r.quadrantId as QuadrantId)
    ? (r.quadrantId as QuadrantId)
    : 'inbox';
  return {
    id: r.id,
    title: r.title,
    description: typeof r.description === 'string' ? r.description : undefined,
    quadrantId,
    completed: r.completed === true,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    closedAt: typeof r.closedAt === 'number' ? r.closedAt : undefined,
    starred: r.starred === true ? true : undefined,
  };
}

// ponytail: accepts bare Task[] too (older/hand-made backups), not just {tasks:[...]}.
export function parseBackup(text: string): { tasks: Task[]; profile?: Profile } {
  const raw: unknown = JSON.parse(text);
  const list = Array.isArray(raw) ? raw : (raw as { tasks?: unknown }).tasks;
  if (!Array.isArray(list)) throw new Error('Not a Focus Matrix backup (expected a task list).');
  const tasks = list.map(sanitizeTask).filter((t): t is Task => t !== null);
  const maybeProfile = (raw as { profile?: unknown }).profile as Partial<Profile> | undefined;
  const profile =
    maybeProfile && typeof maybeProfile.name === 'string'
      ? { name: maybeProfile.name, title: typeof maybeProfile.title === 'string' ? maybeProfile.title : '' }
      : undefined;
  return { tasks, profile };
}

export function downloadBackup(tasks: Task[], profile: Profile): void {
  const blob = new Blob([JSON.stringify(buildBackup(tasks, profile), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-matrix-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
