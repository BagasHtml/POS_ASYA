import { sql } from 'drizzle-orm';
import { foreignKey, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { orders } from './orders';
import { products } from './products';

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id').notNull(),
    productId: integer('product_id').notNull(),
    productName: text('product_name').notNull(),
    price: integer('price').notNull(),
    qty: integer('qty').notNull(),
    subtotal: integer('subtotal').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
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