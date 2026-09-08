import { mkdirSync } from 'node:fs';
import { runLocalMigrations } from './local.ts';

const dbPath = runLocalMigrations();
mkdirSync('./data', { recursive: true });
console.log(`migrated ${dbPath}`);
