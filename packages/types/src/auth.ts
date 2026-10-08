import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'kasir', 'user']);
export const userStatusSchema = z.enum(['active', 'inactive']);

export const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Email tidak valid').max(100, 'Email maksimal 100 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: userRoleSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const meSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MeResponse = z.infer<typeof meSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
