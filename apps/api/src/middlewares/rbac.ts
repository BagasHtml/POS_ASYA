import type { Elysia } from 'elysia';
import type { UserRole } from '@asya-pos/types';

export interface RequireRoleGuard {
  beforeHandle: (context: { user: any; set: any }) => unknown;
}

export function requireRole(allowedRoles: UserRole[]): RequireRoleGuard {
  return {
    beforeHandle: ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, message: 'Sesi berakhir. Silakan masuk kembali.' };
      }
      if (!allowedRoles.includes(user.role)) {
        set.status = 403;
        return { success: false, message: 'Anda tidak memiliki akses ke fitur ini.' };
      }
    },
  };
}