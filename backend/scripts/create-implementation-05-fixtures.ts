import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const output = process.env.IMPLEMENTATION_05_MANIFEST;
if (!output) throw new Error('IMPLEMENTATION_05_MANIFEST is required');

async function createFixture(kind: 'complete' | 'reject') {
  const suffix = `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const user = await db.user.create({
    data: {
      email: `deletion-${suffix}@example.test`,
      status: 'ACTIVE',
      profile: { create: { displayName: `Deletion ${kind} fixture` } },
    },
  });
  const request = await db.deletionRequest.create({
    data: { userId: user.id, reason: `Implementation 05 ${kind} fixture` },
  });
  return { userId: user.id, requestId: request.id };
}

async function main() {
  const manifest = {
    complete: await createFixture('complete'),
    reject: await createFixture('reject'),
  };
  writeFileSync(resolve(output), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().finally(async () => db.$disconnect());
