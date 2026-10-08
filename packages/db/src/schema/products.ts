import { foreignKey, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';
import { timestamps } from './common';

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    sku: text('sku').notNull().unique(),
    categoryId: integer('category_id'),
    price: integer('price').notNull(),
    imageUrl: text('image_url'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    categoryFk: foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }),
    skuIdx: index('sku_idx').on(table.sku),
  })
);