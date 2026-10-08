import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from '../env';
import type { UserRole } from '@asya-pos/types';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export const authGuard = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      exp: env.JWT_EXPIRES_IN,
    })
  )
  .derive(
    { as: 'global' },
    async ({ cookie, jwt }): Promise<{ user: AuthenticatedUser | null }> => {
      const token = cookie.auth.value as string | undefined;
      if (!token) return { user: null };
      const payload: any = await jwt.verify(token);
      if (!payload || !payload.id || !payload.email || !payload.role) return { user: null };
      return {
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        },
      };
    }
  );