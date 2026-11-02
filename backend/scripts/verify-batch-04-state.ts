import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.BATCH_04_MANIFEST;
if (!file) throw new Error('BATCH_04_MANIFEST is required');
const m = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
async function main() {
  const [target, entitlement, completeRequest, completeUser, rejectRequest, flag, setting] =
    await Promise.all([
      db.user.findUnique({
        where: { id: m.targetUserId },
        include: { roles: { include: { role: true } } },
      }),
      db.entitlement.findUnique({ where: { id: m.entitlementId } }),
      db.deletionRequest.findUnique({ where: { id: m.completeRequestId } }),
      db.user.findUnique({ where: { id: m.completeUserId } }),
      db.deletionRequest.findUnique({ where: { id: m.rejectRequestId } }),
      db.featureFlag.findUnique({ where: { key: m.featureFlagKey } }),
      db.setting.findUnique({ where: { key: m.settingKey } }),
    ]);
  if (target?.status !== 'ACTIVE')
    throw new Error(`Target user status mismatch: ${target?.status}`);
  if (!target.roles.some((x) => x.role.code === 'learner'))
    throw new Error('Target learner role missing');
  if (entitlement?.status !== 'REVOKED')
    throw new Error(`Entitlement state mismatch: ${entitlement?.status}`);
  if (completeRequest?.status !== 'COMPLETED' || completeUser?.status !== 'DELETED')
    throw new Error('Deletion completion state mismatch');
  if (rejectRequest?.status !== 'REJECTED')
    throw new Error(`Deletion rejection state mismatch: ${rejectRequest?.status}`);
  if (!flag?.enabled) throw new Error('Feature flag was not enabled');
  if (!setting || setting.isSecret) throw new Error('Public setting state mismatch');
  console.log(
    JSON.stringify(
      {
        verified: true,
        entitlementStatus: entitlement.status,
        completedDeletion: completeRequest.status,
        rejectedDeletion: rejectRequest.status,
        flagEnabled: flag.enabled,
      },
      null,
      2,
    ),
  );
}
main().finally(async () => db.$disconnect());
