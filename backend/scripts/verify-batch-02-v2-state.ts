import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.BATCH_02_V2_MANIFEST;
if (!file) throw new Error('BATCH_02_V2_MANIFEST is required');
const manifestText = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const m = JSON.parse(manifestText);

async function main() {
  const [cancelOrder, rejected, approved] = await Promise.all([
    db.order.findUnique({ where: { id: m.cancelOrderId } }),
    db.refund.findUnique({ where: { id: m.rejectedRefundId } }),
    db.refund.findUnique({ where: { id: m.approvedRefundId } }),
  ]);
  if (cancelOrder?.status !== 'CANCELLED')
    throw new Error(`Order cancellation mismatch: ${cancelOrder?.status}`);
  if (rejected?.status !== 'REJECTED')
    throw new Error(`Refund rejection mismatch: ${rejected?.status}`);
  if (approved?.status !== 'PROCESSING')
    throw new Error(`Refund approval mismatch: ${approved?.status}`);
  console.log(
    JSON.stringify(
      {
        verified: true,
        cancelOrderId: cancelOrder.id,
        rejectedRefundId: rejected.id,
        approvedRefundId: approved.id,
      },
      null,
      2,
    ),
  );
}

main().finally(async () => db.$disconnect());
