import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
const output = process.env.BATCH_04_MANIFEST;
if (!testerDir || !output) throw new Error('TESTER_DIR and BATCH_04_MANIFEST are required');
const base = JSON.parse(
  readFileSync(resolve(testerDir, 'fixture-manifest.json'), 'utf8').replace(/^\uFEFF/, ''),
);
const tag = `batch-04-${Date.now()}`;

async function user(label: string) {
  return db.user.create({
    data: {
      email: `${label}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}@example.test`,
      status: 'ACTIVE',
      profile: { create: { displayName: `Batch 04 ${label}` } },
    },
  });
}

async function main() {
  const language = await db.language.findUnique({ where: { code: 'en' } });
  if (!language) throw new Error('English language fixture is missing');
  const target = await user('target');
  const completeUser = await user('delete-complete');
  const rejectUser = await user('delete-reject');
  const completeRequest = await db.deletionRequest.create({
    data: { userId: completeUser.id, reason: 'Batch 04 completion' },
  });
  const rejectRequest = await db.deletionRequest.create({
    data: { userId: rejectUser.id, reason: 'Batch 04 rejection' },
  });
  const work = await db.work.create({
    data: { slug: `${tag}-work`, languageId: language.id, status: 'PUBLISHED' },
  });
  const version = await db.workVersion.create({
    data: {
      workId: work.id,
      version: 1,
      title: 'Batch 04 Entitlement Work',
      summary: tag,
      content: { blocks: [] },
      searchText: tag,
    },
  });
  await db.work.update({
    where: { id: work.id },
    data: { publishedVersionId: version.id, publishedAt: new Date() },
  });
  await db.featureFlag.upsert({
    where: { key: 'batch.04.flag' },
    update: { description: 'Batch 04 workflow flag' },
    create: {
      key: 'batch.04.flag',
      description: 'Batch 04 workflow flag',
      enabled: false,
      configuration: {},
    },
  });
  const manifest = {
    tag,
    adminId: base.adminId,
    learnerId: base.learnerId,
    baseWorkId: base.workId,
    targetUserId: target.id,
    completeRequestId: completeRequest.id,
    completeUserId: completeUser.id,
    rejectRequestId: rejectRequest.id,
    rejectUserId: rejectUser.id,
    entitlementWorkId: work.id,
    featureFlagKey: 'batch.04.flag',
  };
  writeFileSync(resolve(output), JSON.stringify(manifest, null, 2), { encoding: 'utf8' });
  console.log(JSON.stringify(manifest, null, 2));
}
main().finally(async () => db.$disconnect());
