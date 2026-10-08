import { defineMiddleware } from 'astro:middleware';
import { env } from '@asya-pos/config';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const forwardPath = url.pathname.replace(/^\/api/, '');
  const target = new URL(forwardPath + url.search, env.API_BASE_URL);

  const init: RequestInit = { method: request.method, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }
  init.headers = new Headers(request.headers);
  init.headers.delete('host');

  try {
    const response = await fetch(target, init);
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('[web] api proxy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi.',
      }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
});