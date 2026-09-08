import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from './schema.ts';

/**
 * Portable query surface. D1 and better-sqlite3 drizzle instances share the
 * same query-builder API for our subset (insert/select/update/delete with
 * eq/and); the D1 instance is cast to this type at the adapter boundary
 * (`db/d1.ts`) so route handlers stay driver-agnostic (spec US-20).
 */
export type Db = BetterSQLite3Database<typeof schema>;

export interface GetDbInput {
  /** Cloudflare D1 binding — handled by the Workers entry via `db/d1.ts`. */
  d1?: unknown;
  sqlitePath?: string;
  memory?: boolean;
}

export function resolveSqlitePath(override?: string): string {
  const envPath =
    typeof process !== 'undefined' ? (process.env?.SQLITE_PATH as string | undefined) : undefined;
  return override ?? envPath ?? './data/sqlite.db';
}
