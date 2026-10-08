import { foreignKey, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { timestamps } from './common';

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    invoiceNo: text('invoice_no').notNull().unique(),
    userId: integer('user_id').notNull(),
    customerName: text('customer_name'),
    total: integer('total').notNull(),
    paymentMethod: text('payment_method', { enum: ['cash', 'qris', 'transfer', 'card'] }).notNull().default('cash'),
    amountPaid: integer('amount_paid').notNull().default(0),
    changeAmount: integer('change_amount').notNull().default(0),
    status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).notNull().default('completed'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => ({
    invoiceIdx: index('invoice_idx').on(table.invoiceNo),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);