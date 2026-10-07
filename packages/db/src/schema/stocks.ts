import { mysqlTable, int, timestamp, index, foreignKey } from 'drizzle-orm/mysql-core';
import { products } from './products';

export const stocks = mysqlTable(
  'stocks',
  {
    id: int('id').primaryKey().autoincrement(),
    productId: int('product_id').notNull().unique(),
    qty: int('qty').default(0).notNull(),
    minStock: int('min_stock').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productFk: foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
    }),
  })
);
