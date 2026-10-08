import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Database } from 'bun:sqlite';

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/migrations');

interface TestDatabase {
  url: string;
  cleanup: () => void;
}

export function runMigrations(sqlite: Database, migrationsDir: string): void {
  const journalPath = join(migrationsDir, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf-8')) as {
    entries: { tag: string }[];
  };
  for (const entry of journal.entries) {
    const sql = readFileSync(join(migrationsDir, `${entry.tag}.sql`), 'utf-8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
}

export function createTestDatabase(): TestDatabase {
  const dir = mkdtempSync(join(tmpdir(), 'asya-pos-test-'));
  const url = join(dir, 'test.db');

  const tempDb = new Database(url);
  runMigrations(tempDb, migrationsDir);
  tempDb.close();

  return {
    url,
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
}

export function cleanupTempDirs(): void {
  for (const dir of readdirSync(tmpdir())) {
    if (dir.startsWith('asya-pos-test-')) {
      try {
        rmSync(join(tmpdir(), dir), { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
}