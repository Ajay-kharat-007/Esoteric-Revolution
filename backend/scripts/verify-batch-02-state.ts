import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const file = process.env.BATCH_02_MANIFEST;
if (!file) throw new Error('BATCH_02_MANIFEST is required');
const m = JSON.parse(readFileSync(file, 'utf8'));

async function main() {
  const cancelOrder = await db.order.findUnique({ where: { id: m.cancelOrderId } });
  const rejected = await db.refund.findUnique({ where: { id: m.rejectedRefundId } });
  const approved = await db.refund.findUnique({ where: { id: m.approvedRefundId } });
  if (cancelOrder?.status !== 'CANCELLED') throw new Error('Order cancellation state mismatch');
  if (rejected?.status !== 'REJECTED') throw new Error('Refund rejection state mismatch');
  if (approved?.status !== 'APPROVED') throw new Error('Refund approval state mismatch');
  console.log(
    JSON.stringify(
      {
        verified: true,
        cancelOrder: cancelOrder.id,
        rejectedRefund: rejected.id,
        approvedRefund: approved.id,
      },
      null,
      2,
    ),
  );
}

main().finally(async () => db.$disconnect());
