import { mysqlTable, int, varchar, json, timestamp, index, foreignKey } from 'drizzle-orm/mysql-core';
import { users } from './users';

export const activityLogs = mysqlTable(
  'activity_logs',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id'),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    meta: json('meta'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
    actionIdx: index('action_idx').on(table.action),
    entityIdx: index('entity_idx').on(table.entityType, table.entityId),
    createdIdx: index('created_idx').on(table.createdAt),
  })
);
