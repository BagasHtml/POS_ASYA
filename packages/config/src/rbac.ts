import type { UserRole } from '@asya-pos/types';

export const roleRedirects: Record<UserRole, string> = {
  admin: '/admin',
  kasir: '/cashier',
  user: '/dashboard',
};

export const routePermissions: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/admin/*': ['admin'],
  '/cashier': ['admin', 'kasir'],
  '/dashboard': ['admin', 'kasir', 'user'],
};

export function canAccess(path: string, role: UserRole): boolean {
  const patterns = Object.keys(routePermissions);
  for (const pattern of patterns) {
    if (pattern === path) {
      return routePermissions[pattern].includes(role);
    }
    if (pattern.endsWith('*')) {
      const base = pattern.slice(0, -1);
      if (path.startsWith(base)) {
        return routePermissions[pattern].includes(role);
      }
    }
  }
  return true;
}
