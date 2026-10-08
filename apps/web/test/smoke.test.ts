import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createTestDatabase } from '@asya-pos/db/test/helpers';
import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const tempDb = createTestDatabase();
process.env.DATABASE_URL = tempDb.url;

const API_PORT = 3199;
const WEB_PORT = 4322;
process.env.API_PORT = String(API_PORT);
process.env.API_BASE_URL = `http://127.0.0.1:${API_PORT}`;
process.env.WEB_URL = `http://127.0.0.1:${WEB_PORT}`;

const webRoot = fileURLToPath(new URL('..', import.meta.url));

const { buildApp } = await import('../../api/src/app');

let apiServer: any;
let webProcess: any;
let webReady = false;

beforeAll(async () => {
  const app = buildApp();
  app.listen({ port: API_PORT, hostname: '127.0.0.1' });
  apiServer = app.server;

  if (!existsSync(fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url)))) {
    const build = spawnSync('bun', ['x', 'astro', 'build'], { cwd: webRoot, env: process.env });
    if (build.status !== 0) throw new Error('astro build failed before smoke test');
  }

  webProcess = spawn('bun', ['./dist/server/entry.mjs'], {
    cwd: webRoot,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(WEB_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const startAt = Date.now();
  while (Date.now() - startAt < 20000) {
    try {
      const res = await fetch(`http://127.0.0.1:${WEB_PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        webReady = true;
        break;
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!webReady) throw new Error('web server did not start');
});

afterAll(() => {
  webProcess?.kill('SIGTERM');
  apiServer?.stop(true);
  tempDb.cleanup();
});

describe('landing page', () => {
  test('serves landing with h1 and CTAs', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Asya POS');
    expect(html).toContain('Mencatat penjualan toko Anda');
    expect(html).toContain('/auth/register');
    expect(html).toContain('/auth/login');
  });
});

describe('auth pages', () => {
  test('login page renders form', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/auth/login`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('loginForm');
    expect(html).toContain('formError');
  });

  test('register page renders form', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/auth/register`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('registerForm');
    expect(html).toContain('formError');
  });

  test('unknown web route renders 404', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/tidak-ada`);
    expect(res.status).toBe(404);
  });
});

describe('web -> api proxy', () => {
  test('proxies login and preserves auth cookie', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Web Proxy',
        email: 'webproxy@asya-pos.local',
        password: 'rahasia123',
      }),
    });
    expect(res.status).toBe(200);
    const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
    expect(cookie).toContain('auth=');

    const me = await fetch(`http://127.0.0.1:${WEB_PORT}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    const meJson = await me.json();
    expect(me.status).toBe(200);
    expect(meJson.data.email).toBe('webproxy@asya-pos.local');
  });

  test('proxies clear validation message', async () => {
    const res = await fetch(`http://127.0.0.1:${WEB_PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bukan-email', password: 'x' }),
    });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.message).toContain('Email');
  });
});