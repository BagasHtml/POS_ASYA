import { Elysia } from 'elysia';
import { db } from '@asya-pos/db';
import { users } from '@asya-pos/db';
import { eq } from 'drizzle-orm';
import { loginSchema, registerSchema } from '@asya-pos/types';
import { hashPassword, verifyPassword } from '../utils/auth';
import { env } from '../env';
import { logActivity } from '../services/log.service';
import { fail, ok } from '../utils/response';
import { authGuard } from '../middlewares/auth';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(authGuard)
  .post(
    '/register',
    async ({ body, set, jwt, cookie }) => {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return fail(parsed.error.issues[0]?.message ?? 'Data tidak valid');
      }
      const { name, email, password } = parsed.data;

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        set.status = 409;
        return fail('Email sudah terdaftar');
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: 'user',
          status: 'active',
        })
        .returning({ id: users.id });

      const token = await jwt.sign({ id: user.id, email, role: 'user', name });
      cookie.auth.set({ ...cookieOptions, value: token });

      void logActivity({
        userId: user.id,
        action: 'register',
        entityType: 'user',
        entityId: String(user.id),
        meta: { email },
      });

      return ok('Registrasi berhasil', { role: 'user' });
    },
    { body: registerSchema }
  )
  .post(
    '/login',
    async ({ body, set, jwt, cookie }) => {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return fail(parsed.error.issues[0]?.message ?? 'Data tidak valid');
      }
      const { email, password } = parsed.data;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        set.status = 401;
        return fail('Email atau password salah');
      }
      if (user.status !== 'active') {
        set.status = 403;
        return fail('Akun tidak aktif. Hubungi administrator.');
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) {
        set.status = 401;
        return fail('Email atau password salah');
      }

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
      cookie.auth.set({ ...cookieOptions, value: token });

      void logActivity({
        userId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: String(user.id),
        meta: { email },
      });

      return ok('Login berhasil', { role: user.role });
    },
    { body: loginSchema }
  )
  .post('/logout', ({ cookie }) => {
    cookie.auth.remove();
    return ok('Logout berhasil');
  })
  .get('/me', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return fail('Sesi berakhir. Silakan masuk kembali.');
    }
    const [current] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!current || current.status !== 'active') {
      set.status = 401;
      return fail('Sesi berakhir. Silakan masuk kembali.');
    }
    return ok('', {
      id: current.id,
      name: current.name,
      email: current.email,
      role: current.role,
      status: current.status,
    });
  });