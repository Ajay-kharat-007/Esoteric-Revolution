import 'dotenv/config';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const scrypt = promisify(scryptCallback);

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

async function createTestUser(
  email: string,
  password: string,
  displayName: string,
  roleCode: 'admin' | 'learner',
) {
  const role = await db.role.findUniqueOrThrow({
    where: { code: roleCode },
  });

  const user = await db.user.upsert({
    where: { email },
    update: {
      passwordHash: await hashPassword(password),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          create: { displayName },
          update: { displayName },
        },
      },
    },
    create: {
      email,
      passwordHash: await hashPassword(password),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: { displayName },
      },
    },
  });

  await db.userRole.deleteMany({
    where: { userId: user.id },
  });

  await db.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log({
    email,
    role: roleCode,
    status: 'READY',
  });
}

async function main() {
  await createTestUser('api-admin@example.test', 'Admin@Test#2026', 'API Test Admin', 'admin');

  await createTestUser(
    'api-learner@example.test',
    'Learner@Test#2026',
    'API Test Learner',
    'learner',
  );
}

main().finally(async () => {
  await db.$disconnect();
});
