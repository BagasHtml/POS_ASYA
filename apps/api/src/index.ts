import { Elysia } from 'elysia';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import { env } from './env';
import { authRoutes } from './routes/auth';

const app = new Elysia()
  .use(cookie())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      exp: env.JWT_EXPIRES_IN,
    })
  )
  .derive(async ({ cookie, jwt, store }) => {
    const token = cookie.auth;
    if (token) {
      const payload: any = await jwt.verify(token);
      if (payload) {
        (store as any).user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        };
      }
    }
  })
  .get('/', () => ({ success: true, message: 'Asya POS API' }))
  .use(authRoutes)
  .listen({ port: env.API_PORT, hostname: '0.0.0.0' });

console.log(`Asya POS API running on http://localhost:${env.API_PORT}`);
