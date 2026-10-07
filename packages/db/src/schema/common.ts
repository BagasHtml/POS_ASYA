import { timestamp, datetime } from 'drizzle-orm/mysql-core';

export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
};

export const datetimeFields = {
  createdAt: datetime('created_at').defaultNow().notNull(),
  updatedAt: datetime('updated_at').defaultNow().onUpdateNow().notNull(),
};
