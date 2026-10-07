import { mysqlTable, int, varchar, timestamp, index, foreignKey } from 'drizzle-orm/mysql-core';
import { orders } from './orders';
import { products } from './products';

export const orderItems = mysqlTable(
  'order_items',
  {
    id: int('id').primaryKey().autoincrement(),
    orderId: int('order_id').notNull(),
    productId: int('product_id').notNull(),
    productName: varchar('product_name', { length: 150 }).notNull(),
    price: int('price').notNull(),
    qty: int('qty').notNull(),
    subtotal: int('subtotal').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderFk: foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }),
    productFk: foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
    }),
  })
);
