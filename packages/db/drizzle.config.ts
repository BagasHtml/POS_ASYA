import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: new URL('../../.env', import.meta.url).pathname });

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dbUrl = process.env.DATABASE_URL!;
const resolvePath = dbUrl === ':memory:' ? ':memory:' : isAbsolute(dbUrl) ? dbUrl : join(projectRoot, dbUrl);

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolvePath,
  },
});
