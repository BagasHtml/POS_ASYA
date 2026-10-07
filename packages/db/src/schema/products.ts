import { mysqlTable, int, varchar, decimal, tinyint, timestamp, index, foreignKey } from 'drizzle-orm/mysql-core';
import { categories } from './categories';

export const products = mysqlTable(
  'products',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 150 }).notNull(),
    sku: varchar('sku', { length: 50 }).notNull().unique(),
    categoryId: int('category_id'),
    price: int('price').notNull(),
    imageUrl: varchar('image_url', { length: 255 }),
    isActive: tinyint('is_active').default(1).notNull(),
    isDeleted: tinyint('is_deleted').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryFk: foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }),
    skuIdx: index('sku_idx').on(table.sku),
  })
);
