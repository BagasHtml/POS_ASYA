import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  slug: z.string().min(1, 'Slug wajib diisi').max(100, 'Slug maksimal 100 karakter').optional(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(150, 'Nama produk maksimal 150 karakter'),
  sku: z.string().min(1, 'SKU wajib diisi').max(50, 'SKU maksimal 50 karakter'),
  categoryId: z.number().int('Kategori tidak valid').positive('Kategori tidak valid').nullable().optional(),
  price: z.number().int('Harga harus bilangan bulat').min(0, 'Harga tidak boleh negatif'),
  imageUrl: z.string().url('URL gambar tidak valid').nullable().optional(),
  isActive: z.boolean().optional(),
});

export const stockSchema = z.object({
  productId: z.number().int('Produk tidak valid').positive('Produk tidak valid'),
  qty: z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif'),
  minStock: z.number().int('Stok minimum harus bilangan bulat').min(0, 'Stok minimum tidak boleh negatif').optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockInput = z.infer<typeof stockSchema>;