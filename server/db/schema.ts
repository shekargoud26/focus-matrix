import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const QUADRANT_IDS = ['q1', 'q2', 'q3', 'q4', 'inbox'] as const;
export type QuadrantId = (typeof QUADRANT_IDS)[number];

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId), index('sessions_expires_at_idx').on(t.expiresAt)],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    quadrantId: text('quadrant_id').notNull().$type<QuadrantId>(),
    completed: integer('completed').notNull().default(0),
    starred: integer('starred').notNull().default(0),
    position: integer('position').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    closedAt: integer('closed_at'),
  },
  (t) => [index('tasks_user_id_idx').on(t.userId)],
);

export const profiles = sqliteTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  title: text('title'),
  updatedAt: integer('updated_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
