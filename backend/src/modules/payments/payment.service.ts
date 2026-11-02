import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import {
  EntitlementStatus,
  OrderStatus,
  PaymentStatus,
  RefundStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type { PayuWebhookDto, RefundWebhookDto, ReturnDto } from './payment.dto';
type PaymentView = Prisma.PaymentGetPayload<{ include: { order: true; events: true } }>;
@Injectable()
export class PaymentService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private json<T extends Record<string, unknown>>(v: T) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, typeof x === 'bigint' ? x.toString() : x]),
    );
  }
  private paymentJson(p: PaymentView) {
    return { ...this.json(p), order: this.json(p.order), events: p.events };
  }
  private async handoff(p: PaymentView) {
    const amount = (Number(p.order.totalMinor) / 100).toFixed(2);
    const info = 'Esoteric Library Order ' + p.order.id;
    const member = await this.db.user.findUnique({
      where: { id: p.order.userId },
      select: { email: true, phone: true, profile: { select: { displayName: true } } },
    });
    const firstname = member?.profile?.displayName || 'Library member';
    const email = member?.email || '';
    const fields = {
      key: this.config.getOrThrow<string>('payu.key'),
      txnid: p.providerTransactionId,
      amount,
      productinfo: info,
      firstname,
      email,
      phone: member?.phone || '',
      udf1: p.id,
      surl: this.config.getOrThrow<string>('payu.successUrl'),
      furl: this.config.getOrThrow<string>('payu.failureUrl'),
      hash: createHash('sha512')
        .update(
          [
            this.config.getOrThrow<string>('payu.key'),
            p.providerTransactionId,
            amount,
            info,
            firstname,
            email,
            p.id,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            this.config.getOrThrow<string>('payu.salt'),
          ].join('|'),
        )
        .digest('hex'),
    };
    return {
      payment: this.paymentJson(p),
      checkout: { url: this.config.getOrThrow<string>('payu.baseUrl'), fields },
    };
  }
  private signature(payload: unknown) {
    return createHmac('sha256', this.config.getOrThrow<string>('payu.webhookSecret'))
      .update(JSON.stringify(payload))
      .digest('hex');
  }
  verifySignature(payload: unknown, received?: string) {
    if (!received) throw new UnauthorizedException('Missing webhook signature');
    const a = Buffer.from(this.signature(payload));
    const b = Buffer.from(received);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException('Invalid webhook signature');
  }
  async initiate(orderId: string, userId: string, key: string) {
    const existing = await this.db.payment.findUnique({
      where: { idempotencyKey: key },
      include: { order: true, events: true },
    });
    if (existing) {
      if (existing.order.userId !== userId) throw new ForbiddenException();
      return this.handoff(existing);
    }
    const order = await this.db.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException('Order is not payable');
    const txn = 'EL-' + randomUUID();
    const payment = await this.db.payment.create({
      data: {
        orderId,
        idempotencyKey: key,
        providerTransactionId: txn,
        status: PaymentStatus.PENDING,
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
      include: { order: true, events: true },
    });
    return this.handoff(payment);
  }
  async browserReturn(dto: ReturnDto, status: 'success' | 'failure') {
    const paymentId = dto.paymentId ?? dto.udf1;
    const transactionId = dto.transactionId ?? dto.txnid;
    const p = paymentId
      ? await this.db.payment.findUnique({ where: { id: paymentId } })
      : transactionId
        ? await this.db.payment.findUnique({ where: { providerTransactionId: transactionId } })
        : null;
    if (!p) throw new NotFoundException('Payment not found');
    const origin = this.config.getOrThrow<string>('app.origin').replace(/\/$/, '');
    return `${origin}/payment-status/${p.id}?providerReturn=${status}`;
  }
  async webhook(d: PayuWebhookDto, s?: string) {
    this.verifySignature(d, s);
    const p = await this.db.payment.findUnique({
      where: { id: d.paymentId },
      include: { order: { include: { items: { include: { product: true } } } } },
    });
    if (!p) throw new NotFoundException('Payment not found');
    if (
      p.providerTransactionId !== d.transactionId ||
      p.amountMinor !== BigInt(d.amountMinor) ||
      p.currency !== d.currency
    )
      throw new ConflictException('Payment linkage verification failed');
    const status = PaymentStatus[d.status];
    return this.db.$transaction(async (tx) => {
      const duplicate = await tx.paymentEvent.findUnique({ where: { providerEventId: d.eventId } });
      if (duplicate) return { duplicate: true, paymentId: p.id, status: p.status };
      const allowed: Record<PaymentStatus, PaymentStatus[]> = {
        CREATED: [
          PaymentStatus.CREATED,
          PaymentStatus.PENDING,
          PaymentStatus.FAILED,
          PaymentStatus.CANCELLED,
        ],
        PENDING: [
          PaymentStatus.PENDING,
          PaymentStatus.CAPTURED,
          PaymentStatus.FAILED,
          PaymentStatus.CANCELLED,
        ],
        CAPTURED: [PaymentStatus.CAPTURED],
        FAILED: [PaymentStatus.FAILED],
        CANCELLED: [PaymentStatus.CANCELLED],
        REFUNDED: [PaymentStatus.REFUNDED],
      };
      if (!allowed[p.status].includes(status))
        throw new ConflictException(`Payment cannot transition from ${p.status} to ${status}`);
      await tx.paymentEvent.create({
        data: {
          paymentId: p.id,
          providerEventId: d.eventId,
          type: d.status,
          payload: d as unknown as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      await tx.payment.update({
        where: { id: p.id },
        data: { status, providerPayload: d as unknown as Prisma.InputJsonValue },
      });
      if (status === PaymentStatus.CAPTURED) {
        await tx.order.update({ where: { id: p.orderId }, data: { status: OrderStatus.PAID } });
        for (const item of p.order.items) {
          if (item.product.workId) {
            const k = 'payment:' + p.id + ':work:' + item.product.workId;
            await tx.entitlement.upsert({
              where: { idempotencyKey: k },
              update: {},
              create: {
                userId: p.order.userId,
                workId: item.product.workId,
                sourceType: 'PAYMENT',
                sourceId: p.id,
                idempotencyKey: k,
              },
            });
          }
        }
        await tx.invoice.upsert({
          where: { orderId: p.orderId },
          update: {},
          create: {
            orderId: p.orderId,
            number: 'EL-' + new Date().getUTCFullYear() + '-' + p.orderId.slice(0, 8).toUpperCase(),
          },
        });
      }
      return { duplicate: false, paymentId: p.id, status };
    });
  }
  async status(id: string, userId: string, roles: string[]) {
    const p = await this.db.payment.findUnique({
      where: { id },
      include: { order: true, events: true },
    });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.order.userId !== userId && !roles.some((r) => r === 'admin'))
      throw new ForbiddenException();
    return this.paymentJson(p);
  }
  async verify(id: string) {
    const p = await this.db.payment.findUnique({
      where: { id },
      include: { order: true, events: true },
    });
    if (!p) throw new NotFoundException('Payment not found');
    return {
      ...this.paymentJson(p),
      reconciledAt: new Date(),
      providerMode: this.config.getOrThrow<string>('payu.environment'),
    };
  }
  async requestRefund(orderId: string, userId: string, reason: string, amount?: number) {
    const o = await this.db.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: { where: { status: PaymentStatus.CAPTURED }, take: 1 } },
    });
    if (!o) throw new NotFoundException('Order not found');
    const p = o.payments[0];
    if (!p) throw new ConflictException('Captured payment required');
    const active = await this.db.refund.findFirst({
      where: {
        orderId,
        status: { in: [RefundStatus.REQUESTED, RefundStatus.APPROVED, RefundStatus.PROCESSING] },
      },
    });
    if (active) throw new ConflictException('Active refund already exists');
    const value = BigInt(amount ?? Number(o.totalMinor));
    if (value > o.totalMinor) throw new ConflictException('Refund exceeds order total');
    return this.json(
      await this.db.refund.create({
        data: { orderId, paymentId: p.id, userId, amountMinor: value, reason },
      }),
    );
  }
  async refunds(userId: string) {
    return (
      await this.db.refund.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ).map((r) => this.json(r));
  }
  async adminRefunds(status?: RefundStatus, query?: string) {
    const refunds = await this.db.refund.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { user: { phone: { contains: query } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
        order: { select: { currency: true, totalMinor: true, status: true } },
        payment: { select: { status: true, provider: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return refunds.map((refund) => ({
      ...this.json(refund),
      user: refund.user,
      order: { ...refund.order, totalMinor: refund.order.totalMinor.toString() },
      payment: refund.payment,
    }));
  }
  async adminRefund(id: string) {
    const refund = await this.db.refund.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: { select: { displayName: true } },
          },
        },
        order: { include: { items: true } },
        payment: {
          select: { id: true, status: true, provider: true, providerTransactionId: true },
        },
      },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    const history = await this.db.auditEvent.findMany({
      where: { resourceType: 'refund', resourceId: id },
      orderBy: { createdAt: 'asc' },
    });
    return {
      ...this.json(refund),
      user: refund.user,
      order: {
        ...refund.order,
        subtotalMinor: refund.order.subtotalMinor.toString(),
        discountMinor: refund.order.discountMinor.toString(),
        totalMinor: refund.order.totalMinor.toString(),
        items: refund.order.items.map((item) => ({
          ...item,
          unitAmountMinor: item.unitAmountMinor.toString(),
          totalAmountMinor: item.totalAmountMinor.toString(),
        })),
      },
      payment: refund.payment,
      history,
    };
  }
  async approve(id: string, actorId: string, reason: string) {
    const r = await this.db.refund.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Refund not found');
    if (r.status !== RefundStatus.REQUESTED) throw new ConflictException('Refund is not pending');
    const u = await this.db.refund.update({
      where: { id },
      data: {
        status: RefundStatus.PROCESSING,
        decisionReason: reason,
        providerRefundId: 'RFD-' + randomUUID(),
      },
    });
    const auditEvent = await this.db.auditEvent.create({
      data: { actorId, action: 'REFUND_APPROVED', resourceType: 'refund', resourceId: id, reason },
    });
    return { ...this.json(u), auditEventId: auditEvent.id };
  }
  async reject(id: string, actorId: string, reason: string) {
    const r = await this.db.refund.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Refund not found');
    if (r.status !== RefundStatus.REQUESTED) throw new ConflictException('Refund is not pending');
    const u = await this.db.refund.update({
      where: { id },
      data: { status: RefundStatus.REJECTED, decisionReason: reason },
    });
    const auditEvent = await this.db.auditEvent.create({
      data: { actorId, action: 'REFUND_REJECTED', resourceType: 'refund', resourceId: id, reason },
    });
    return { ...this.json(u), auditEventId: auditEvent.id };
  }
  async refundWebhook(d: RefundWebhookDto, s?: string) {
    this.verifySignature(d, s);
    const status = RefundStatus[d.status];
    const current = await this.db.refund.findUnique({ where: { id: d.refundId } });
    if (!current) throw new NotFoundException('Refund not found');
    if (!current.paymentId) throw new ConflictException('Refund payment linkage is missing');
    const paymentId = current.paymentId;
    return this.db.$transaction(async (tx) => {
      const duplicate = await tx.paymentEvent.findUnique({ where: { providerEventId: d.eventId } });
      if (duplicate) return { duplicate: true, ...this.json(current) };
      const allowed: Record<RefundStatus, RefundStatus[]> = {
        REQUESTED: [],
        APPROVED: [RefundStatus.PROCESSING, RefundStatus.COMPLETED, RefundStatus.FAILED],
        REJECTED: [],
        PROCESSING: [RefundStatus.PROCESSING, RefundStatus.COMPLETED, RefundStatus.FAILED],
        COMPLETED: [RefundStatus.COMPLETED],
        FAILED: [RefundStatus.FAILED],
      };
      if (!allowed[current.status].includes(status))
        throw new ConflictException(`Refund cannot transition from ${current.status} to ${status}`);
      await tx.paymentEvent.create({
        data: {
          paymentId,
          providerEventId: d.eventId,
          type: `REFUND_${d.status}`,
          payload: d as unknown as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      const refund = await tx.refund.update({
        where: { id: d.refundId },
        data: { providerRefundId: d.providerRefundId, status },
      });
      if (status === RefundStatus.COMPLETED) {
        await tx.order.update({
          where: { id: refund.orderId },
          data: { status: OrderStatus.REFUNDED },
        });
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.REFUNDED },
        });
        await tx.entitlement.updateMany({
          where: { sourceId: paymentId, status: EntitlementStatus.ACTIVE },
          data: { status: EntitlementStatus.REVOKED, revokedAt: new Date() },
        });
      }
      return { duplicate: false, ...this.json(refund) };
    });
  }
  async invoice(orderId: string, userId: string, roles: string[]) {
    const o = await this.db.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    });
    if (!o) throw new NotFoundException('Order not found');
    if (o.userId !== userId && !roles.some((r) => r === 'admin')) throw new ForbiddenException();
    if (!o.invoice) throw new NotFoundException('Invoice not ready');
    return o.invoice;
  }
  testSignature(payload: unknown) {
    if (this.config.get('payu.environment') !== 'test') throw new ForbiddenException();
    return this.signature(payload);
  }
}
