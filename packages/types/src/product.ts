import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(150),
  sku: z.string().min(1).max(50),
  categoryId: z.number().int().positive().nullable().optional(),
  price: z.number().int().min(0),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const stockSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().min(0),
  minStock: z.number().int().min(0).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockInput = z.infer<typeof stockSchema>;
