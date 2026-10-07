import { z } from 'zod';

export const activityLogFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ActivityLogFilter = z.infer<typeof activityLogFilterSchema>;
