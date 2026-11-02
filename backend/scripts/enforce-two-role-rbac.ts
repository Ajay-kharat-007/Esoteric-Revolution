import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const admin = await db.role.upsert({
    where: { code: 'admin' },
    update: { name: 'Admin' },
    create: { code: 'admin', name: 'Admin' },
  });
  const learner = await db.role.upsert({
    where: { code: 'learner' },
    update: { name: 'Learner' },
    create: { code: 'learner', name: 'Learner' },
  });
  const legacy = await db.role.findMany({
    where: { code: { notIn: ['admin', 'learner'] } },
    select: { id: true },
  });
  if (legacy.length) {
    const links = await db.userRole.findMany({
      where: { roleId: { in: legacy.map((r) => r.id) } },
      select: { userId: true },
    });
    for (const { userId } of links) {
      await db.userRole.deleteMany({ where: { userId } });
      await db.userRole.create({ data: { userId, roleId: admin.id } });
    }
    await db.rolePermission.deleteMany({ where: { roleId: { in: legacy.map((r) => r.id) } } });
    await db.role.deleteMany({ where: { id: { in: legacy.map((r) => r.id) } } });
  }
  const roleless = await db.user.findMany({ where: { roles: { none: {} } }, select: { id: true } });
  if (roleless.length)
    await db.userRole.createMany({
      data: roleless.map((u) => ({ userId: u.id, roleId: learner.id })),
      skipDuplicates: true,
    });
  console.log({ enforced: true, roles: ['admin', 'learner'], rolelessFixed: roleless.length });
}
main().finally(async () => db.$disconnect());
