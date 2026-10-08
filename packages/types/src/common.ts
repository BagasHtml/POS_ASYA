import { z } from 'zod';

export const idSchema = z.number().int('ID tidak valid').positive('ID tidak valid');
export const uuidSchema = z.string().uuid('UUID tidak valid');

export const paginationSchema = z.object({
  page: z.coerce.number().int('Halaman tidak valid').min(1, 'Halaman minimal 1').default(1),
  limit: z.coerce.number().int('Limit tidak valid').min(1, 'Limit minimal 1').max(100, 'Limit maksimal 100').default(10),
  search: z.string().optional(),
});

export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});