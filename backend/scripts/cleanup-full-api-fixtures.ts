import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const tag = 'api-full-fixture';
  const work = await db.work.findUnique({ where: { slug: `${tag}-work` } });
  if (work) {
    await db.entitlement.deleteMany({ where: { workId: work.id } });
    await db.contentReport.deleteMany({ where: { workId: work.id } });
    await db.product.deleteMany({ where: { workId: work.id } });
    await db.learningPathItem.deleteMany({ where: { workId: work.id } });
    await db.work.delete({ where: { id: work.id } });
  }
  await db.learningPath.deleteMany({ where: { slug: `${tag}-path` } });
  await db.insight.deleteMany({ where: { slug: `${tag}-insight` } });
  await db.category.deleteMany({ where: { slug: `${tag}-category` } });
  await db.topic.deleteMany({ where: { slug: `${tag}-topic` } });
  await db.person.deleteMany({ where: { slug: `${tag}-person` } });
  console.log({ cleaned: true, tag });
}
main().finally(async () => db.$disconnect());
