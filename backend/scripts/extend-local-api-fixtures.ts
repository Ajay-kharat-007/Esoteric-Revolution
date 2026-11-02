import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
if (!testerDir) throw new Error('TESTER_DIR is required');
const manifestPath = resolve(testerDir, 'fixture-manifest.json');
const overridesPath = resolve(testerDir, 'request-overrides.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
const tag = 'api-full-local-resolution';

async function main() {
  const learner = await db.user.findUnique({ where: { id: manifest.learnerId } });
  const product = await db.product.findUnique({ where: { id: manifest.productId } });
  const quiz = await db.quiz.findUnique({ where: { id: manifest.quizId } });
  if (!learner || !product || !quiz)
    throw new Error('Base fixtures are missing. Run create-fixtures.ps1 first.');

  // A dedicated converted cart and completed order. The active learning cart remains untouched.
  let order = await db.order.findUnique({ where: { idempotencyKey: `${tag}-order` } });
  let orderCart;
  if (!order) {
    orderCart = await db.cart.create({
      data: {
        userId: learner.id,
        status: 'CONVERTED',
        currency: 'INR',
        expiresAt: new Date(Date.now() + 86400000),
        items: { create: { productId: product.id, quantity: 1 } },
      },
    });
    order = await db.order.create({
      data: {
        userId: learner.id,
        cartId: orderCart.id,
        idempotencyKey: `${tag}-order`,
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
  } else {
    orderCart = await db.cart.findUniqueOrThrow({ where: { id: order.cartId } });
    order = await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
  }

  const payment = await db.payment.upsert({
    where: { idempotencyKey: `${tag}-payment` },
    update: { status: 'CAPTURED', providerTransactionId: `${tag}-tx`, amountMinor: 19900n },
    create: {
      orderId: order.id,
      provider: 'LOCAL_FIXTURE',
      providerTransactionId: `${tag}-tx`,
      idempotencyKey: `${tag}-payment`,
      status: 'CAPTURED',
      amountMinor: 19900n,
      currency: 'INR',
      providerPayload: { fixture: true },
    },
  });

  let refund = await db.refund.findFirst({ where: { orderId: order.id, reason: tag } });
  if (!refund) {
    refund = await db.refund.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        userId: learner.id,
        status: 'APPROVED',
        amountMinor: 19900n,
        reason: tag,
        decisionReason: 'Approved local fixture',
      },
    });
  }

  const invoice = await db.invoice.upsert({
    where: { orderId: order.id },
    update: {},
    create: { orderId: order.id, number: `LOCAL-${order.id.slice(0, 8).toUpperCase()}` },
  });

  await db.quizAnswer.upsert({
    where: {
      attemptId_questionId: { attemptId: manifest.attemptId, questionId: manifest.questionId },
    },
    update: { optionId: manifest.optionId },
    create: {
      attemptId: manifest.attemptId,
      questionId: manifest.questionId,
      optionId: manifest.optionId,
    },
  });
  const attempt = await db.quizAttempt.update({
    where: { id: manifest.attemptId },
    data: { status: 'SUBMITTED', score: 100, submittedAt: new Date() },
  });

  Object.assign(manifest, {
    orderCartId: orderCart.id,
    orderId: order.id,
    paymentId: payment.id,
    refundId: refund.id,
    invoiceId: invoice.id,
    submittedAttemptId: attempt.id,
  });

  const path = (id: string) => ({ pathValues: { id } });
  Object.assign(overrides, {
    'GET /api/v1/admin/learning-paths/{id}': path(manifest.learningPathId),
    'GET /api/v1/admin/insights/{id}': path(manifest.insightId),
    'GET /api/v1/admin/quizzes/{id}': path(manifest.quizId),
    'GET /api/v1/orders/{id}': path(order.id),
    'GET /api/v1/admin/orders/{id}': path(order.id),
    'GET /api/v1/payments/{id}/status': path(payment.id),
    'GET /api/v1/admin/refunds/{id}': path(refund.id),
    'GET /api/v1/orders/{id}/invoice': path(order.id),
    'GET /api/v1/quiz-attempts/{attemptId}/result': { pathValues: { attemptId: attempt.id } },
    'GET /api/v1/search': { queryValues: { q: 'fixture' } },
  });

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));
  console.log(
    JSON.stringify(
      {
        extended: true,
        orderId: order.id,
        paymentId: payment.id,
        refundId: refund.id,
        invoiceId: invoice.id,
        submittedAttemptId: attempt.id,
      },
      null,
      2,
    ),
  );
}

main().finally(async () => db.$disconnect());
