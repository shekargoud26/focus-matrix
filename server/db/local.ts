import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';
import { resolveSqlitePath, type Db } from './index.ts';

/**
 * Node-only adapter (VPS / tests). Never imported from the Workers entry —
 * keeps `better-sqlite3` + `node:*` out of the edge bundle (spec US-20).
 */
export function createLocalDb(input: { sqlitePath?: string; memory?: boolean } = {}): Db {
  if (input.memory) {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    return drizzle(sqlite, { schema });
  }
  const path = resolveSqlitePath(input.sqlitePath);
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

/** Apply `./drizzle` migrations to the local file DB (idempotent re-run). */
export function runLocalMigrations(sqlitePath?: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = resolve(here, '../../drizzle');
  const dbPath = resolve(here, '../../', resolveSqlitePath(sqlitePath));
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  migrate(drizzle(sqlite), { migrationsFolder });
  sqlite.close();
  return dbPath;
}
