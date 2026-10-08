import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { env } from './env';
import { authRoutes } from './routes/auth';

export const buildApp = () =>
  new Elysia()
    .onError(({ error, set }) => {
      const validationError = error as any;
      if (validationError?.all && validationError?.code === 'VALIDATION') {
        const issue = validationError.all[0];
        set.status = 422;
        return {
          success: false,
          message: issue?.message ?? 'Data yang dikirim tidak valid',
        };
      }
      if (validationError?.code === 'NOT_FOUND') {
        set.status = 404;
        return { success: false, message: 'Halaman tidak ditemukan' };
      }
      console.error('[api] unhandled error:', error);
      set.status = 500;
      return { success: false, message: 'Terjadi kesalahan di server. Coba lagi.' };
    })
    .use(
      jwt({
        name: 'jwt',
        secret: env.JWT_SECRET,
        exp: env.JWT_EXPIRES_IN,
      })
    )
    .get('/', () => ({ success: true, message: 'Asya POS API' }))
    .use(authRoutes);