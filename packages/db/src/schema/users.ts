import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from './common';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'kasir', 'user'] }).notNull().default('user'),
    status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
    ...timestamps,
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
  })
);