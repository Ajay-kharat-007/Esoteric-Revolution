import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
const output = process.env.BATCH_02_V2_MANIFEST;
if (!testerDir || !output) throw new Error('TESTER_DIR and BATCH_02_V2_MANIFEST are required');
const base = JSON.parse(
  readFileSync(resolve(testerDir, 'fixture-manifest.json'), 'utf8').replace(/^\uFEFF/, ''),
);
const tag = `batch-02-v2-${Date.now()}`;

async function createPaidOrder(suffix: string, productId: string, productName: string) {
  const cart = await db.cart.create({
    data: {
      userId: base.learnerId,
      status: 'CONVERTED',
      currency: 'INR',
      expiresAt: new Date(Date.now() + 86400000),
      items: { create: { productId, quantity: 1 } },
    },
  });
  const order = await db.order.create({
    data: {
      userId: base.learnerId,
      cartId: cart.id,
      idempotencyKey: `${tag}-${suffix}-order`,
      status: 'PAID',
      currency: 'INR',
      subtotalMinor: 24900n,
      discountMinor: 0n,
      totalMinor: 24900n,
      items: {
        create: {
          productId,
          productName,
          quantity: 1,
          unitAmountMinor: 24900n,
          totalAmountMinor: 24900n,
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
      amountMinor: 24900n,
      currency: 'INR',
      providerPayload: { fixture: true, batch: '02-v2', suffix },
    },
  });
  const invoice = await db.invoice.create({
    data: {
      orderId: order.id,
      number: `B02V2-${suffix.toUpperCase()}-${order.id.slice(0, 8).toUpperCase()}`,
    },
  });
  return { cartId: cart.id, orderId: order.id, paymentId: payment.id, invoiceId: invoice.id };
}

async function main() {
  const learner = await db.user.findUnique({ where: { id: base.learnerId } });
  if (!learner) throw new Error('Base learner fixture is missing');

  // A disposable standalone product prevents duplicate-purchase entitlement conflicts.
  const product = await db.product.create({
    data: {
      name: `Batch 02 v2 Product ${tag}`,
      description: 'Disposable product for ordered commerce testing',
      status: 'ACTIVE',
      prices: {
        create: {
          amountMinor: 24900n,
          currency: 'INR',
          startsAt: new Date(Date.now() - 60000),
        },
      },
    },
  });

  const coupon = await db.coupon.create({
    data: {
      code: `B02V2${Date.now()}`,
      type: 'FIXED',
      value: 1000,
      currency: 'INR',
      startsAt: new Date(Date.now() - 60000),
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
    },
  });

  const rejectFlow = await createPaidOrder('reject', product.id, product.name);
  const approveFlow = await createPaidOrder('approve', product.id, product.name);
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
  writeFileSync(resolve(output), JSON.stringify(manifest, null, 2), { encoding: 'utf8' });
  console.log(JSON.stringify(manifest, null, 2));
}

main().finally(async () => db.$disconnect());
