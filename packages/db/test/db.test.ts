import { describe, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { and, eq, ne } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createTestDatabase, cleanupTempDirs } from './helpers';
import { createClient } from '../src/client';
import * as schema from '../src/schema';
import { users } from '../src/schema';

describe('test database', () => {
  test('migrations apply cleanly', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema });

    const tables = sqlite
      .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toContain('users');
    expect(tables).toContain('categories');
    expect(tables).toContain('products');
    expect(tables).toContain('stocks');
    expect(tables).toContain('orders');
    expect(tables).toContain('order_items');
    expect(tables).toContain('activity_logs');

    sqlite.close();
    cleanup();
  });

  test('createClient applies pragmas and enforces foreign keys', async () => {
    const { url, cleanup } = createTestDatabase();
    const db = createClient(url);

    const fkMode = (db.$client.query('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys;
    expect(fkMode).toBe(1);
    const walMode = (db.$client.query('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode;
    expect(walMode.toLowerCase()).toBe('wal');
    const busy = (db.$client.query('PRAGMA busy_timeout').get() as { timeout: number }).timeout;
    expect(busy).toBe(5000);

    await db.insert(users).values({
      name: 'Kasir',
      email: 'kasir@asya-pos.local',
      passwordHash: await argon2.hash('rahasia123'),
      role: 'kasir',
      status: 'active',
    });

    let fkThrew = false;
    try {
      await db.insert(schema.orders).values({
        invoiceNo: 'INV-001',
        userId: 999,
        total: 10000,
      });
    } catch {
      fkThrew = true;
    }
    expect(fkThrew).toBe(true);

    db.$client.close();
    cleanup();
  });

  test('unique email constraint rejects duplicates', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema });

    await db.insert(users).values({
      name: 'Admin',
      email: 'duplicate@asya-pos.local',
      passwordHash: await argon2.hash('rahasia123'),
      role: 'admin',
      status: 'active',
    });

    let dupThrew = false;
    try {
      await db.insert(users).values({
        name: 'Admin 2',
        email: 'duplicate@asya-pos.local',
        passwordHash: await argon2.hash('rahasia123'),
        role: 'user',
        status: 'active',
      });
    } catch {
      dupThrew = true;
    }
    expect(dupThrew).toBe(true);

    sqlite.close();
    cleanup();
  });

  test('user CRUD with argon2 hashing', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema });

    const hash = await argon2.hash('rahasia123');
    const [inserted] = await db
      .insert(users)
      .values({
        name: 'Pedagang',
        email: 'pedagang@asya-pos.local',
        passwordHash: hash,
        role: 'user',
        status: 'active',
      })
      .returning();

    expect(inserted.id).toBeGreaterThan(0);
    expect(inserted.passwordHash).not.toBe('rahasia123');
    expect(await argon2.verify(inserted.passwordHash, 'rahasia123')).toBe(true);

    const [found] = await db.select().from(users).where(eq(users.email, 'pedagang@asya-pos.local')).limit(1);
    expect(found).toBeDefined();
    expect(found.role).toBe('user');

    const [updated] = await db.update(users).set({ status: 'inactive' }).where(eq(users.id, inserted.id)).returning();
    expect(updated.status).toBe('inactive');

    const deleted = await db.delete(users).where(eq(users.id, inserted.id));
    expect(deleted.changes).toBe(1);

    const remaining = await db.select().from(users).where(ne(users.email, 'x'));
    expect(remaining.some((u) => u.email === 'pedagang@asya-pos.local')).toBe(false);

    sqlite.close();
    cleanup();
  });

  test('WAL journal mode is enabled', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    sqlite.exec('PRAGMA journal_mode = WAL');
    const mode = sqlite.query('PRAGMA journal_mode').get() as { journal_mode: string };
    expect(mode.journal_mode.toLowerCase()).toBe('wal');
    sqlite.close();
    cleanup();
  });

  test('concurrent inserts to unique columns do not conflict', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    sqlite.exec('PRAGMA busy_timeout = 5000');
    const db = drizzle(sqlite, { schema });

    const hash = await argon2.hash('rahasia123');
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, async (_, i) =>
        db.insert(users).values({
          name: `Kasir ${i}`,
          email: `kasir-${i}@asya-pos.local`,
          passwordHash: hash,
          role: 'kasir',
          status: 'active',
        })
      )
    );

    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(0);

    const count = (await db.select({ id: users.id }).from(users)).length;
    expect(count).toBe(5);

    sqlite.close();
    cleanup();
  });

  test('query for non-existent user returns empty result', async () => {
    const { url, cleanup } = createTestDatabase();
    const sqlite = new Database(url);
    const db = drizzle(sqlite, { schema });

    const found = await db.select().from(users).where(and(eq(users.email, 'tidak-ada@asya-pos.local'))).limit(1);
    expect(found).toHaveLength(0);

    sqlite.close();
    cleanup();
  });
});

test('temp dirs are cleaned up', () => {
  expect(() => cleanupTempDirs()).not.toThrow();
});