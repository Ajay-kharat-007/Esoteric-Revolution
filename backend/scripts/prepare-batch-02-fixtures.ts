import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
const output = process.env.BATCH_02_MANIFEST;
if (!testerDir || !output) throw new Error('TESTER_DIR and BATCH_02_MANIFEST are required');
const base = JSON.parse(readFileSync(resolve(testerDir, 'fixture-manifest.json'), 'utf8'));
const tag = `batch-02-${Date.now()}`;

async function createPaidOrder(suffix: string) {
  const cart = await db.cart.create({
    data: {
      userId: base.learnerId,
      status: 'CONVERTED',
      currency: 'INR',
      expiresAt: new Date(Date.now() + 86400000),
      items: { create: { productId: base.productId, quantity: 1 } },
    },
  });
  const product = await db.product.findUniqueOrThrow({ where: { id: base.productId } });
  const order = await db.order.create({
    data: {
      userId: base.learnerId,
      cartId: cart.id,
      idempotencyKey: `${tag}-${suffix}-order`,
      status: 'PAID',
      currency: 'INR',
      subtotalMinor: 19900n,
      discountMinor: 0n,
      totalMinor: 19900n,
      items: {
        create: {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitAmountMinor: 19900n,
          totalAmountMinor: 19900n,
        },
      },
    },
  });
  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      provider: 'LOCAL_FIXTURE',
      providerTransactionId: `${tag}-${suffix}-tx`,
      idempotencyKey: `${tag}-${suffix}-payment`,
      status: 'CAPTURED',
      amountMinor: 19900n,
      currency: 'INR',
      providerPayload: { batch: 2, suffix },
    },
  });
  const invoice = await db.invoice.create({
    data: {
      orderId: order.id,
      number: `B02-${suffix.toUpperCase()}-${order.id.slice(0, 8).toUpperCase()}`,
    },
  });
  return { cartId: cart.id, orderId: order.id, paymentId: payment.id, invoiceId: invoice.id };
}

async function main() {
  const learner = await db.user.findUnique({ where: { id: base.learnerId } });
  const product = await db.product.findUnique({ where: { id: base.productId } });
  if (!learner || !product) throw new Error('Base learner/product fixtures are missing');

  const coupon = await db.coupon.upsert({
    where: { code: 'BATCH02SAVE10' },
    update: {
      isActive: true,
      startsAt: new Date(Date.now() - 60000),
      expiresAt: new Date(Date.now() + 86400000),
    },
    create: {
      code: 'BATCH02SAVE10',
      type: 'FIXED',
      value: 1000,
      currency: 'INR',
      startsAt: new Date(Date.now() - 60000),
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
    },
  });

  const rejectFlow = await createPaidOrder('reject');
  const approveFlow = await createPaidOrder('approve');
  const manifest = {
    tag,
    learnerId: base.learnerId,
    adminId: base.adminId,
    productId: product.id,
    couponId: coupon.id,
    couponCode: coupon.code,
    rejectFlow,
    approveFlow,
  };
  writeFileSync(resolve(output), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().finally(async () => db.$disconnect());
