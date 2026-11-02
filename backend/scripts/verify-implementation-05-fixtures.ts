import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.IMPLEMENTATION_05_MANIFEST;
if (!file) throw new Error('IMPLEMENTATION_05_MANIFEST is required');
const manifest = JSON.parse(readFileSync(file, 'utf8'));

async function main() {
  const completeRequest = await db.deletionRequest.findUnique({
    where: { id: manifest.complete.requestId },
  });
  const completeUser = await db.user.findUnique({ where: { id: manifest.complete.userId } });
  const rejectRequest = await db.deletionRequest.findUnique({
    where: { id: manifest.reject.requestId },
  });
  console.log(JSON.stringify({ completeRequest, completeUser, rejectRequest }, null, 2));
  if (completeRequest?.status !== 'COMPLETED')
    throw new Error('Complete request was not completed');
  if (
    completeUser?.status !== 'DELETED' ||
    completeUser.phone !== null ||
    completeUser.passwordHash !== null
  )
    throw new Error('Completed user was not safely anonymized');
  if (rejectRequest?.status !== 'REJECTED') throw new Error('Reject request was not rejected');
}

main().finally(async () => db.$disconnect());
