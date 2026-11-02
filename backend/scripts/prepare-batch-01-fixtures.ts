import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
const output = process.env.BATCH_01_MANIFEST;
if (!testerDir || !output) throw new Error('TESTER_DIR and BATCH_01_MANIFEST are required');
const base = JSON.parse(readFileSync(resolve(testerDir, 'fixture-manifest.json'), 'utf8'));
const tag = `batch-01-${Date.now()}`;

async function main() {
  const learner = await db.user.findUnique({ where: { id: base.learnerId } });
  const lesson = await db.lesson.findUnique({ where: { id: base.lessonId } });
  const quiz = await db.quiz.findUnique({ where: { id: base.quizId } });
  if (!learner || !lesson || !quiz) throw new Error('Base learner fixtures are missing');

  await db.consentType.upsert({
    where: { code: 'BATCH_01_TEST' },
    update: { name: 'Batch 01 Test Consent', version: 1 },
    create: { code: 'BATCH_01_TEST', name: 'Batch 01 Test Consent', required: false, version: 1 },
  });

  const notification = await db.notification.create({
    data: {
      createdById: base.adminId,
      title: `Batch 01 Notification ${tag}`,
      body: 'Ordered learner workflow notification',
      audience: { userIds: [base.learnerId], type: 'SYSTEM', deepLink: '/library' },
      status: 'SENT',
      scheduledAt: new Date(),
      sentAt: new Date(),
    },
  });

  // Clean state for unique/upsert learner resources exercised by this batch.
  await db.bookmark.deleteMany({ where: { userId: base.learnerId, lessonId: base.lessonId } });
  await db.rating.deleteMany({ where: { userId: base.learnerId, workId: base.workId } });
  await db.lessonProgress.deleteMany({
    where: { userId: base.learnerId, lessonId: base.lessonId, format: 'batch-01' },
  });

  const manifest = {
    tag,
    learnerId: base.learnerId,
    workId: base.workId,
    lessonId: base.lessonId,
    quizId: base.quizId,
    questionId: base.questionId,
    optionId: base.optionId,
    notificationId: notification.id,
    consentCode: 'BATCH_01_TEST',
  };
  writeFileSync(resolve(output), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().finally(async () => db.$disconnect());
