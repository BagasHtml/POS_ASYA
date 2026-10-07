import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  API_PORT: Number(process.env.API_PORT || 3000),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  WEB_URL: process.env.WEB_URL || 'http://localhost:4321',
} as const;
