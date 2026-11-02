import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { EmailWebhookDto, StorageWebhookDto } from './internal.dto';
import { MetricsService } from './metrics.service';

@Injectable()
export class InternalOperationsService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}
  private verify(body: object, supplied: string | undefined, secretKey: string) {
    const expected = createHmac('sha256', this.config.getOrThrow<string>(secretKey))
      .update(JSON.stringify(body))
      .digest('hex');
    const a = Buffer.from(supplied ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException('Invalid webhook signature');
  }
  async processOutbox(limit = 50) {
    const rows = await this.db.outboxEvent.findMany({
      where: { processedAt: null, availableAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 100),
    });
    let processed = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await this.db.$transaction(async (tx) => {
          if (row.topic === 'notification.dispatch')
            await tx.notification.update({
              where: { id: row.aggregateId },
              data: { status: 'SENT', sentAt: new Date() },
            });
          else if (row.topic === 'campaign.dispatch')
            await tx.campaign.update({ where: { id: row.aggregateId }, data: { status: 'SENT' } });
          await tx.outboxEvent.update({
            where: { id: row.id },
            data: { processedAt: new Date(), attempts: { increment: 1 }, lastError: null },
          });
        });
        processed += 1;
      } catch (error) {
        failed += 1;
        await this.db.outboxEvent.update({
          where: { id: row.id },
          data: {
            attempts: { increment: 1 },
            lastError:
              error instanceof Error ? error.message.slice(0, 1000) : 'Unknown worker error',
            availableAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** row.attempts)),
          },
        });
      }
    }
    return { selected: rows.length, processed, failed };
  }
  async retry(id: string) {
    const row = await this.db.outboxEvent.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Job not found');
    if (!row.lastError && !row.processedAt) throw new BadRequestException('Job is already pending');
    return this.db.outboxEvent.update({
      where: { id },
      data: { processedAt: null, lastError: null, attempts: 0, availableAt: new Date() },
    });
  }
  async storage(body: StorageWebhookDto, signature?: string) {
    this.verify(body, signature, 'security.storageWebhookSecret');
    const prior = await this.db.webhookReceipt.findUnique({
      where: { provider_providerEventId: { provider: 'STORAGE', providerEventId: body.eventId } },
    });
    if (prior) return { duplicate: true };
    await this.db.$transaction(async (tx) => {
      await tx.mediaAsset.update({
        where: { id: body.assetId },
        data: { status: body.status, metadata: body.metadata as Prisma.InputJsonValue | undefined },
      });
      await tx.webhookReceipt.create({
        data: {
          provider: 'STORAGE',
          providerEventId: body.eventId,
          payload: body as unknown as Prisma.InputJsonValue,
        },
      });
    });
    return { duplicate: false, status: body.status };
  }
  async email(body: EmailWebhookDto, signature?: string) {
    this.verify(body, signature, 'security.emailWebhookSecret');
    const prior = await this.db.webhookReceipt.findUnique({
      where: { provider_providerEventId: { provider: 'EMAIL', providerEventId: body.eventId } },
    });
    if (prior) return { duplicate: true };
    await this.db.webhookReceipt.create({
      data: {
        provider: 'EMAIL',
        providerEventId: body.eventId,
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
    return { duplicate: false, status: body.status };
  }
  async prometheus() {
    const http = this.metrics.snapshot();
    const [outbox, failed, pendingPayments, entitlementMismatches, mediaFailures, expiredRights] =
      await Promise.all([
        this.db.outboxEvent.count({ where: { processedAt: null } }),
        this.db.outboxEvent.count({ where: { lastError: { not: null } } }),
        this.db.payment.count({ where: { status: 'PENDING' } }),
        this.db.payment.count({
          where: {
            status: 'CAPTURED',
            NOT: {
              id: {
                in: (
                  await this.db.entitlement.findMany({
                    where: { sourceType: 'PAYMENT' },
                    select: { sourceId: true },
                  })
                ).map((x) => x.sourceId),
              },
            },
          },
        }),
        this.db.mediaAsset.count({ where: { status: 'FAILED' } }),
        this.db.rightsRecord.count({ where: { status: 'CLEARED', expiresAt: { lt: new Date() } } }),
      ]);
    return (
      [
        `# TYPE esoteric_http_requests_total counter`,
        `esoteric_http_requests_total ${http.requests}`,
        `# TYPE esoteric_http_errors_total counter`,
        `esoteric_http_errors_total ${http.errors}`,
        `# TYPE esoteric_http_duration_milliseconds_total counter`,
        `esoteric_http_duration_milliseconds_total ${http.durationMs.toFixed(3)}`,
        `esoteric_outbox_pending ${outbox}`,
        `esoteric_outbox_failed ${failed}`,
        `esoteric_payments_pending ${pendingPayments}`,
        `esoteric_entitlement_mismatches ${entitlementMismatches}`,
        `esoteric_media_failures ${mediaFailures}`,
        `esoteric_expired_cleared_rights ${expiredRights}`,
        `esoteric_process_uptime_seconds ${process.uptime().toFixed(3)}`,
      ].join('\n') + '\n'
    );
  }
}
