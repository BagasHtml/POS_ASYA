import { mysqlTable, int, varchar, tinyint, timestamp, index } from 'drizzle-orm/mysql-core';

export const categories = mysqlTable(
  'categories',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    isActive: tinyint('is_active').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx: index('slug_idx').on(table.slug),
  })
);
