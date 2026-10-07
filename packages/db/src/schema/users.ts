import { mysqlTable, int, varchar, enum, timestamp, index } from 'drizzle-orm/mysql-core';

export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: enum('role', ['admin', 'kasir', 'user']).notNull().default('user'),
    status: enum('status', ['active', 'inactive']).notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
  })
);
