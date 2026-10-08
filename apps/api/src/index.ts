import { buildApp } from './app';
import { env } from './env';

buildApp().listen({
  port: env.API_PORT,
  hostname: '0.0.0.0',
});

console.log(`Asya POS API running on http://localhost:${env.API_PORT}`);