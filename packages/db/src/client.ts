import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@asya-pos/config';
import * as schema from './schema';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const dbPath = env.DATABASE_URL === ':memory:' ? ':memory:' : isAbsolute(env.DATABASE_URL) ? env.DATABASE_URL : join(projectRoot, env.DATABASE_URL);

if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
