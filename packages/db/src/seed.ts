import 'dotenv/config';
import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';

async function seed() {
  try {
    console.log('Seeding admin user...');

    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@asya-pos.local')).limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const passwordHash = await argon2.hash('admin123');

    await db.insert(users).values({
      name: 'Administrator',
      email: 'admin@asya-pos.local',
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    console.log('Admin user created: admin@asya-pos.local / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
