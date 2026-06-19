export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4' | 'inbox';

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrantId: QuadrantId;
  completed: boolean;
  createdAt: number;
  closedAt?: number;
  starred?: boolean;
}

export interface QuadrantDef {
  id: QuadrantId;
  title: string;
  subtitle: string;
}

export const QUADRANTS: QuadrantDef[] = [
  { id: 'q1', title: 'Do First', subtitle: 'Urgent & Important' },
  { id: 'q2', title: 'Schedule', subtitle: 'Not Urgent & Important' },
  { id: 'q3', title: 'Delegate', subtitle: 'Urgent & Not Important' },
  { id: 'q4', title: 'Eliminate', subtitle: 'Not Urgent & Not Important' },
];
