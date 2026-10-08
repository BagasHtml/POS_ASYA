import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createTestDatabase } from '@asya-pos/db/test/helpers';

const tempDb = createTestDatabase();
process.env.DATABASE_URL = tempDb.url;

const { buildApp } = await import('../src/app');

let server: any;
let baseUrl: string;

beforeAll(async () => {
  const app = buildApp();
  app.listen({ port: 0, hostname: '127.0.0.1' });
  server = app.server;
  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server?.stop(true);
  tempDb.cleanup();
});

async function postJSON(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { res, json: await res.json().catch(() => null) };
}

async function getJSON(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(baseUrl + path, { headers });
  return { res, json: await res.json().catch(() => null) };
}

describe('GET /', () => {
  test('returns service info', async () => {
    const { res, json } = await getJSON('/');
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

describe('POST /auth/register', () => {
  test('registers default role user and sets auth cookie', async () => {
    const { res, json } = await postJSON('/auth/register', {
      name: 'Test User',
      email: 'test@asya-pos.local',
      password: 'rahasia123',
    });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.role).toBe('user');
    expect(res.headers.get('set-cookie')).toContain('auth=');
    expect(res.headers.get('set-cookie')).toContain('HttpOnly');
  });

  test('rejects empty name', async () => {
    const { res, json } = await postJSON('/auth/register', {
      name: '',
      email: 'x@asya-pos.local',
      password: 'rahasia123',
    });
    expect(json.success).toBe(false);
    expect(json.message).toContain('Nama');
  });

  test('rejects invalid email', async () => {
    const { res, json } = await postJSON('/auth/register', {
      name: 'Invalid',
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.message).toContain('Email');
  });

  test('rejects short password', async () => {
    const { res, json } = await postJSON('/auth/register', {
      name: 'Short',
      email: 'short@asya-pos.local',
      password: '123',
    });
    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.message).toContain('Password');
  });

  test('rejects duplicate email', async () => {
    await postJSON('/auth/register', {
      name: 'First',
      email: 'dup@asya-pos.local',
      password: 'rahasia123',
    });
    const { res, json } = await postJSON('/auth/register', {
      name: 'Second',
      email: 'dup@asya-pos.local',
      password: 'rahasia123',
    });
    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Email sudah terdaftar');
  });

  test('cannot self-assign admin role', async () => {
    const { res, json } = await postJSON('/auth/register', {
      name: 'Hacker',
      email: 'hacker@asya-pos.local',
      password: 'rahasia123',
      role: 'admin',
    });
    expect(res.status).toBe(200);
    expect(json.data.role).toBe('user');
  });
});

describe('POST /auth/login', () => {
  test('logs in with correct credentials', async () => {
    await postJSON('/auth/register', {
      name: 'Login User',
      email: 'login@asya-pos.local',
      password: 'rahasia123',
    });
    const { res, json } = await postJSON('/auth/login', {
      email: 'login@asya-pos.local',
      password: 'rahasia123',
    });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(res.headers.get('set-cookie')).toContain('auth=');
  });

  test('rejects wrong password', async () => {
    const { res, json } = await postJSON('/auth/login', {
      email: 'login@asya-pos.local',
      password: 'salah-password',
    });
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Email atau password salah');
  });

  test('rejects unknown email', async () => {
    const { res, json } = await postJSON('/auth/login', {
      email: 'tidak-ada@asya-pos.local',
      password: 'rahasia123',
    });
    expect(res.status).toBe(401);
    expect(json.message).toBe('Email atau password salah');
  });

  test('rejects invalid email format', async () => {
    const { res, json } = await postJSON('/auth/login', {
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(res.status).toBe(422);
    expect(json.message).toContain('Email');
  });
});

describe('auth session', () => {
  let cookie: string;

  test('me without cookie returns 401', async () => {
    const { res, json } = await getJSON('/auth/me');
    expect(res.status).toBe(401);
    expect(json.message).toBe('Sesi berakhir. Silakan masuk kembali.');
  });

  test('me with valid cookie returns profile', async () => {
    await postJSON('/auth/register', {
      name: 'Session User',
      email: 'session@asya-pos.local',
      password: 'rahasia123',
    });
    const login = await postJSON('/auth/login', {
      email: 'session@asya-pos.local',
      password: 'rahasia123',
    });
    cookie = (login.res.headers.get('set-cookie') || '').split(';')[0];

    const { res, json } = await getJSON('/auth/me', { Cookie: cookie });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.email).toBe('session@asya-pos.local');
    expect(json.data.role).toBe('user');
  });

  test('me with tampered cookie returns 401', async () => {
    const { res } = await getJSON('/auth/me', { Cookie: 'auth=palsu-token-12345' });
    expect(res.status).toBe(401);
  });

  test('logout clears the auth cookie', async () => {
    const { res, json } = await postJSON('/auth/logout', {}, { Cookie: cookie });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    const clearCookie = res.headers.get('set-cookie');
    expect(clearCookie).toBeTruthy();
    expect(clearCookie).toContain('auth=;');
  });
});

describe('unknown routes', () => {
  test('returns 404 with clear message', async () => {
    const { res, json } = await getJSON('/tidak-ada');
    expect(res.status).toBe(404);
    expect(json.message).toBe('Halaman tidak ditemukan');
  });
});