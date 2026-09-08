import type { Task } from '../types';

/** Default demo tasks used for first-run guest mode (previously inline in App). */
export function defaultSeedTasks(): Task[] {
  return [
    {
      id: 'seed-1',
      title: 'Review project roadmap 🚀',
      description: 'Prepare the outline for the upcoming team sync and prioritize milestone releases.',
      quadrantId: 'q1',
      completed: false,
      createdAt: Date.now() - 7200000,
      starred: true,
    },
    {
      id: 'seed-2',
      title: 'Schedule weekly planning session 🗓️',
      description: 'Block 30 minutes on calendar for personal review of goals.',
      quadrantId: 'q2',
      completed: false,
      createdAt: Date.now() - 14400000,
    },
    {
      id: 'seed-3',
      title: 'Delegate social media graphics 🎨',
      description: 'Ask Sarah to draft the promo assets for the next launch.',
      quadrantId: 'q3',
      completed: false,
      createdAt: Date.now() - 21600000,
    },
    {
      id: 'seed-4',
      title: 'Clear out old browser tabs 🛑',
      description: 'Bookmarked for clean-up but not critical.',
      quadrantId: 'q4',
      completed: false,
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'seed-5',
      title: 'Review incoming feedback submissions 📥',
      description: 'Sort through client suggestions and place them in the matrix.',
      quadrantId: 'inbox',
      completed: false,
      createdAt: Date.now() - 3600000,
    },
    // Completed tasks for profile activity heatmap
    {
      id: 'seed-c1',
      title: 'Design initial draft of landing page',
      quadrantId: 'q1',
      completed: true,
      createdAt: Date.now() - 86400000 * 1,
      closedAt: Date.now() - 3600000 * 1,
    },
    {
      id: 'seed-c2',
      title: 'Refactor state management logic',
      quadrantId: 'q1',
      completed: true,
      createdAt: Date.now() - 86400000 * 1,
      closedAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'seed-c3',
      title: 'Setup project ESLint & Prettier config',
      quadrantId: 'q2',
      completed: true,
      createdAt: Date.now() - 86400000 * 2,
      closedAt: Date.now() - 86400000 * 1 - 3600000 * 3,
    },
    {
      id: 'seed-c4',
      title: 'Write automated unit tests for drag-and-drop',
      quadrantId: 'q2',
      completed: true,
      createdAt: Date.now() - 86400000 * 2,
      closedAt: Date.now() - 86400000 * 1 - 3600000 * 4,
    },
    {
      id: 'seed-c5',
      title: 'Prepare project presentation slides',
      quadrantId: 'q3',
      completed: true,
      createdAt: Date.now() - 86400000 * 3,
      closedAt: Date.now() - 86400000 * 2 - 3600000 * 1,
    },
    {
      id: 'seed-c6',
      title: 'Audit application bundle sizes',
      quadrantId: 'q2',
      completed: true,
      createdAt: Date.now() - 86400000 * 5,
      closedAt: Date.now() - 86400000 * 3 - 3600000 * 2,
    },
    {
      id: 'seed-c7',
      title: 'Resolve CSS flexbox layout issues on mobile',
      quadrantId: 'q1',
      completed: true,
      createdAt: Date.now() - 86400000 * 5,
      closedAt: Date.now() - 86400000 * 4 - 3600000 * 5,
    },
    {
      id: 'seed-c8',
      title: 'Conduct user interview for feedback',
      quadrantId: 'q3',
      completed: true,
      createdAt: Date.now() - 86400000 * 8,
      closedAt: Date.now() - 86400000 * 5 - 3600000 * 1,
    },
    {
      id: 'seed-c9',
      title: 'Analyze competitor features list',
      quadrantId: 'q4',
      completed: true,
      createdAt: Date.now() - 86400000 * 10,
      closedAt: Date.now() - 86400000 * 8 - 3600000 * 6,
    },
    {
      id: 'seed-c10',
      title: 'Optimize PNG and SVG asset sizes',
      quadrantId: 'q4',
      completed: true,
      createdAt: Date.now() - 86400000 * 15,
      closedAt: Date.now() - 86400000 * 12 - 3600000 * 2,
    },
    {
      id: 'seed-c11',
      title: 'Document API endpoints in Markdown',
      quadrantId: 'q2',
      completed: true,
      createdAt: Date.now() - 86400000 * 20,
      closedAt: Date.now() - 86400000 * 15 - 3600000 * 4,
    },
    {
      id: 'seed-c12',
      title: 'Fix keyboard focus trapping in modal',
      quadrantId: 'q1',
      completed: true,
      createdAt: Date.now() - 86400000 * 25,
      closedAt: Date.now() - 86400000 * 20 - 3600000 * 8,
    },
  ];
}

export function isSeedTask(t: Pick<Task, 'id'>): boolean {
  return t.id.startsWith('seed-');
}
