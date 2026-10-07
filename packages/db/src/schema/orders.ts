import { mysqlTable, int, varchar, enum, timestamp, index, foreignKey, text } from 'drizzle-orm/mysql-core';
import { users } from './users';

export const orders = mysqlTable(
  'orders',
  {
    id: int('id').primaryKey().autoincrement(),
    invoiceNo: varchar('invoice_no', { length: 50 }).notNull().unique(),
    userId: int('user_id').notNull(),
    customerName: varchar('customer_name', { length: 100 }),
    total: int('total').notNull(),
    paymentMethod: enum('payment_method', ['cash', 'qris', 'transfer', 'card']).default('cash').notNull(),
    amountPaid: int('amount_paid').default(0).notNull(),
    changeAmount: int('change_amount').default(0).notNull(),
    status: enum('status', ['pending', 'completed', 'cancelled']).default('completed').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    invoiceIdx: index('invoice_idx').on(table.invoiceNo),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);
