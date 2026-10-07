import { db } from '@asya-pos/db';
import { activityLogs } from '@asya-pos/db';
import type { InferInsertModel } from 'drizzle-orm';

type LogInsert = InferInsertModel<typeof activityLogs>;

export async function logActivity(data: LogInsert) {
  try {
    await db.insert(activityLogs).values(data);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
