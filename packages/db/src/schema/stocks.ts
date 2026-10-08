import { foreignKey, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { products } from './products';
import { timestamps } from './common';

export const stocks = sqliteTable(
  'stocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull().unique(),
    qty: integer('qty').notNull().default(0),
    minStock: integer('min_stock').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    productFk: foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
    }),
  })
);