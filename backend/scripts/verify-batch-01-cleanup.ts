import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.BATCH_01_MANIFEST;
if (!file) throw new Error('BATCH_01_MANIFEST is required');
const m = JSON.parse(readFileSync(file, 'utf8'));

async function main() {
  const [bookmark, rating, state, attempt] = await Promise.all([
    db.bookmark.findFirst({ where: { userId: m.learnerId, lessonId: m.lessonId } }),
    db.rating.findUnique({ where: { userId_workId: { userId: m.learnerId, workId: m.workId } } }),
    db.userNotificationState.findUnique({
      where: { userId_notificationId: { userId: m.learnerId, notificationId: m.notificationId } },
    }),
    db.quizAttempt.findFirst({
      where: { userId: m.learnerId, quizId: m.quizId, status: 'SUBMITTED' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  if (bookmark) throw new Error('Bookmark cleanup failed');
  if (rating) throw new Error('Rating cleanup failed');
  if (!state?.deletedAt) throw new Error('Notification delete state missing');
  if (!attempt || attempt.score === null) throw new Error('Quiz attempt was not submitted');
  console.log(
    JSON.stringify({ verified: true, attemptId: attempt.id, score: attempt.score }, null, 2),
  );
}

main().finally(async () => db.$disconnect());
