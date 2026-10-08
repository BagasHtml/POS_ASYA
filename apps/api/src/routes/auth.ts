import { Elysia, t } from 'elysia';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import { db } from '@asya-pos/db';
import { users } from '@asya-pos/db';
import { eq } from 'drizzle-orm';
import { loginSchema, registerSchema } from '@asya-pos/types';
import { hashPassword, verifyPassword } from '../utils/auth';
import { env } from '../env';
import { logActivity } from '../services/log.service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(cookie())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      exp: env.JWT_EXPIRES_IN,
    })
  )
  .post(
    '/register',
    async ({ body, set, jwt, setCookie }) => {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return { success: false, message: parsed.error.issues[0]?.message };
      }
      const { name, email, password, role } = parsed.data;

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        set.status = 409;
        return { success: false, message: 'Email sudah terdaftar' };
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: role || 'user',
          status: 'active',
        })
        .returning({ id: users.id });

      const userId = user.id;

      const token = await jwt.sign({ id: userId, email, role: role || 'user', name });
      setCookie('auth', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      await logActivity({
        userId,
        action: 'register',
        entityType: 'user',
        entityId: String(userId),
        meta: { email },
      });

      return { success: true, message: 'Registrasi berhasil' };
    },
    { body: registerSchema }
  )
  .post(
    '/login',
    async ({ body, set, jwt, setCookie }) => {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return { success: false, message: parsed.error.issues[0]?.message };
      }
      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        set.status = 401;
        return { success: false, message: 'Email atau password salah' };
      }
      if (user.status !== 'active') {
        set.status = 403;
        return { success: false, message: 'Akun tidak aktif' };
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) {
        set.status = 401;
        return { success: false, message: 'Email atau password salah' };
      }

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
      setCookie('auth', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      await logActivity({
        userId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: String(user.id),
        meta: { email },
      });

      return { success: true, message: 'Login berhasil', data: { role: user.role } };
    },
    { body: loginSchema }
  )
  .post('/logout', ({ removeCookie }) => {
    removeCookie('auth', { path: '/' });
    return { success: true, message: 'Logout berhasil' };
  })
  .get('/me', async ({ cookie, jwt, set }) => {
    const token = cookie.auth;
    if (!token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    const payload: any = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    const [user] = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);
    if (!user || user.status !== 'active') {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
    return {
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    };
  });
