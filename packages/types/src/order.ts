import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive('Qty minimal 1'),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Keranjang tidak boleh kosong'),
  customerName: z.string().max(100).optional().nullable(),
  paymentMethod: z.enum(['cash', 'qris', 'transfer', 'card']).default('cash'),
  amountPaid: z.number().int().min(0).optional(),
  notes: z.string().max(255).optional().nullable(),
});

export const orderStatusSchema = z.enum(['pending', 'completed', 'cancelled']);

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
