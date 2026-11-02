import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.BATCH_03_MANIFEST;
if (!file) throw new Error('BATCH_03_MANIFEST is required');
const m = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

async function main() {
  const [work, module, lesson, media, source, claim, rights] = await Promise.all([
    db.work.findUnique({ where: { id: m.workId } }),
    db.contentModule.findUnique({ where: { id: m.moduleId } }),
    db.lesson.findUnique({ where: { id: m.lessonId } }),
    db.mediaAsset.findUnique({ where: { id: m.mediaId } }),
    db.source.findUnique({ where: { id: m.sourceId } }),
    db.claim.findUnique({ where: { id: m.claimId } }),
    db.rightsRecord.findUnique({ where: { id: m.rightsId } }),
  ]);
  if (!work || !module || !lesson || !source || !claim || !rights)
    throw new Error('One or more Admin Content records are missing');
  if (!work.publishedVersionId) throw new Error('Work published version was not assigned');
  if (!lesson.publishedVersionId) throw new Error('Lesson published version was not assigned');
  if (media?.status !== 'UPLOADED') throw new Error(`Media state mismatch: ${media?.status}`);
  if (rights.status !== 'CLEARED') throw new Error(`Rights state mismatch: ${rights.status}`);
  console.log(
    JSON.stringify(
      {
        verified: true,
        workId: work.id,
        lessonId: lesson.id,
        mediaStatus: media.status,
        rightsStatus: rights.status,
      },
      null,
      2,
    ),
  );
}
main().finally(async () => db.$disconnect());
