import type { Context } from 'elysia';
import type { UserRole } from '@asya-pos/types';
import { canAccess } from '@asya-pos/config';

export function requireRole(allowedRoles?: UserRole[]) {
  return (c: Context, next: any) => {
    const user = (c as any).store?.user;
    if (!user) {
      return c.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return c.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!allowedRoles) {
      const path = (c as any).request?.url ? new URL((c as any).request.url).pathname : '';
      if (!canAccess(path, user.role)) {
        return c.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    return next();
  };
}
