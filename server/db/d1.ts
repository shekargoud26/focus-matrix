import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.ts';
import type { Db } from './index.ts';

/** Edge-safe adapter: instantiate from the Workers D1 binding. */
export function createD1Db(d1: unknown): Db {
  return drizzle(d1 as any, { schema }) as unknown as Db;
}
