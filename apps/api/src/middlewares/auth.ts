import type { Context } from 'elysia';
import type { UserRole } from '@asya-pos/types';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export function getAuthenticatedUser(c: Context): AuthenticatedUser | null {
  return (c as any).store?.user || null;
}
