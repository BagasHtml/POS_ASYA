import { foreignKey, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { timestamps } from './common';

export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    meta: text('meta', { mode: 'json' }),
    ...timestamps,
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