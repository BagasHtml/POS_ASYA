import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@asya-pos/config';
import * as schema from './schema';

const rootFromModule = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const projectRoot = process.env.ASYA_POS_ROOT || rootFromModule;

export function resolveDbPath(url: string): string {
  if (url === ':memory:') return ':memory:';
  if (isAbsolute(url)) return url;
  return join(projectRoot, url);
}

export function createClient(url: string): BunSQLiteDatabase<typeof schema> {
  const dbPath = resolveDbPath(url);

  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const sqlite = new Database(dbPath);

  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA busy_timeout = 5000');
  sqlite.exec('PRAGMA synchronous = NORMAL');
  sqlite.exec('PRAGMA foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

export const db = createClient(env.DATABASE_URL);
export type DB = typeof db;
