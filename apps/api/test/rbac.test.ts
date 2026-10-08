import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import * as argon2 from 'argon2';
import { createTestDatabase } from '@asya-pos/db/test/helpers';

const tempDb = createTestDatabase();
process.env.DATABASE_URL = tempDb.url;
process.env.JWT_SECRET = 'test-secret';

const [{ db, users }] = await Promise.all([import('@asya-pos/db')]);
const { eq } = await import('drizzle-orm');
const { jwt } = await import('@elysiajs/jwt');
const { requireRole } = await import('../src/middlewares/rbac');
const { authGuard } = await import('../src/middlewares/auth');

let adminCookie: string;
let kasirCookie: string;

async function createUser(email: string, role: 'admin' | 'kasir') {
  const [user] = await db
    .insert(users)
    .values({
      name: email,
      email,
      passwordHash: await argon2.hash('rahasia123'),
      role,
      status: 'active',
    })
    .returning({ id: users.id, email: users.email, role: users.role, name: users.name });
  return user;
}

beforeAll(async () => {
  const admin = await createUser('rbac-admin@asya-pos.local', 'admin');
  const kasir = await createUser('rbac-kasir@asya-pos.local', 'kasir');

  const jwtPlugin = jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'test-secret',
    exp: '1h',
  });

  const app = new Elysia().use(jwtPlugin).post('/login', ({ jwt, body }: any) => {
    const { id, email, role, name } = body;
    return jwt.sign({ id, email, role, name });
  });

  app.listen(0);
  const baseUrl = `http://127.0.0.1:${app.server.port}`;

  adminCookie =
    'auth=' +
    (await (
      await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin),
      })
    ).text());
  kasirCookie =
    'auth=' +
    (await (
      await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kasir),
      })
    ).text());

  app.stop(true);
});

afterAll(() => {
  tempDb.cleanup();
});

describe('requireRole', () => {
  const guarded = () => new Elysia().use(authGuard);

  test('admin-only route allows an admin', async () => {
    const app = guarded().guard(requireRole(['admin'])).get('/admin-data', () => ({ ok: true }));
    app.listen(0);
    const url = `http://127.0.0.1:${app.server.port}/admin-data`;

    const res = await fetch(url, { headers: { Cookie: adminCookie } });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    app.stop(true);
  });

  test('admin-only route blocks a kasir with 403', async () => {
    const app = guarded().guard(requireRole(['admin'])).get('/admin-data', () => ({ ok: true }));
    app.listen(0);
    const url = `http://127.0.0.1:${app.server.port}/admin-data`;

    const res = await fetch(url, { headers: { Cookie: kasirCookie } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toBe('Anda tidak memiliki akses ke fitur ini.');

    app.stop(true);
  });

  test('admin-or-kasir route allows both', async () => {
    const app = guarded()
      .guard(requireRole(['admin', 'kasir']))
      .get('/cashier-data', () => ({ ok: true }));
    app.listen(0);
    const url = `http://127.0.0.1:${app.server.port}/cashier-data`;

    const resAdmin = await fetch(url, { headers: { Cookie: adminCookie } });
    const resKasir = await fetch(url, { headers: { Cookie: kasirCookie } });
    expect(resAdmin.status).toBe(200);
    expect(resKasir.status).toBe(200);

    app.stop(true);
  });

  test('blocks anonymous request with 401', async () => {
    const app = guarded().guard(requireRole(['admin'])).get('/protected', () => ({ ok: true }));
    app.listen(0);
    const url = `http://127.0.0.1:${app.server.port}/protected`;

    const res = await fetch(url);
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe('Sesi berakhir. Silakan masuk kembali.');

    app.stop(true);
  });
});