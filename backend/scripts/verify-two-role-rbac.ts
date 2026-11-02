import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const roles = await db.role.findMany({ orderBy: { code: 'asc' }, select: { code: true } });
  const invalidRoles = roles.filter((r) => !['admin', 'learner'].includes(r.code));
  const users = await db.user.findMany({
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  });
  const invalidUsers = users.filter(
    (u) => u.roles.length !== 1 || !['admin', 'learner'].includes(u.roles[0]?.role.code ?? ''),
  );
  if (roles.length !== 2 || invalidRoles.length || invalidUsers.length)
    throw new Error(
      JSON.stringify({ roles, invalidRoles, invalidUsers: invalidUsers.map((u) => u.id) }),
    );
  console.log(
    JSON.stringify(
      { passed: true, roles: roles.map((r) => r.code), usersChecked: users.length },
      null,
      2,
    ),
  );
}
main().finally(async () => db.$disconnect());
