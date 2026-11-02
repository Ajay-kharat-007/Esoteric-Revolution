import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { EntitlementStatus, MediaStatus, PublicationStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type { ProgressDto } from './learning.dto';
@Injectable()
export class LearningService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  async decision(userId: string, workId: string) {
    const entitlement = await this.db.entitlement.findFirst({
      where: {
        userId,
        workId,
        status: EntitlementStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return entitlement
      ? {
          allowed: true,
          reason: 'ACTIVE_ENTITLEMENT',
          entitlementId: entitlement.id,
          expiresAt: entitlement.expiresAt,
        }
      : { allowed: false, reason: 'NO_ACTIVE_ENTITLEMENT' };
  }
  async require(userId: string, workId: string) {
    const d = await this.decision(userId, workId);
    if (!d.allowed)
      throw new ForbiddenException({ message: 'Work access denied', reason: d.reason });
    return d;
  }
  entitlements(userId: string) {
    return this.db.entitlement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        work: {
          select: {
            slug: true,
            publishedVersion: { select: { title: true, coverImageUrl: true } },
          },
        },
      },
    });
  }
  library(userId: string) {
    return this.db.entitlement.findMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        work: { status: PublicationStatus.PUBLISHED },
      },
      select: {
        id: true,
        startsAt: true,
        expiresAt: true,
        work: {
          select: {
            id: true,
            slug: true,
            publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
          },
        },
      },
    });
  }
  async work(userId: string, workId: string) {
    await this.require(userId, workId);
    const w = await this.db.work.findFirst({
      where: { id: workId, status: PublicationStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        publishedVersion: { select: { title: true, summary: true } },
        modules: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            summary: true,
            position: true,
            lessons: {
              orderBy: { position: 'asc' },
              select: { id: true, slug: true, title: true, summary: true, position: true },
            },
          },
        },
      },
    });
    if (!w) throw new NotFoundException('Published work not found');
    return w;
  }
  private async lessonContext(lessonId: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        module: { select: { workId: true } },
        publishedVersion: {
          select: {
            id: true,
            version: true,
            content: true,
            transcript: true,
            durationSeconds: true,
          },
        },
      },
    });
    if (!lesson?.publishedVersion) throw new NotFoundException('Published lesson not found');
    return lesson;
  }
  async lesson(userId: string, lessonId: string) {
    const l = await this.lessonContext(lessonId);
    await this.require(userId, l.module.workId);
    return l;
  }
  async media(userId: string, lessonId: string) {
    const l = await this.lessonContext(lessonId);
    await this.require(userId, l.module.workId);
    const assets = await this.db.mediaAsset.findMany({
      where: { lessonVersionId: l.publishedVersion!.id, status: MediaStatus.READY },
    });
    const expiresAt = new Date(Date.now() + 10 * 60000);
    return {
      expiresAt,
      items: assets.map((a) => ({
        id: a.id,
        type: a.type,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes.toString(),
        url:
          'https://media.local/' +
          a.objectKey +
          '?expires=' +
          encodeURIComponent(expiresAt.toISOString()) +
          '&signature=' +
          createHmac('sha256', this.config.getOrThrow<string>('auth.accessSecret'))
            .update(a.id + ':' + userId + ':' + expiresAt.toISOString())
            .digest('hex'),
      })),
    };
  }
  async transcript(userId: string, lessonId: string) {
    const l = await this.lessonContext(lessonId);
    await this.require(userId, l.module.workId);
    return { lessonId, transcript: l.publishedVersion!.transcript };
  }
  async progress(userId: string, lessonId: string, d: ProgressDto) {
    const l = await this.lessonContext(lessonId);
    await this.require(userId, l.module.workId);
    return this.db.$transaction(async (tx) => {
      const progress = await tx.lessonProgress.upsert({
        where: { userId_lessonId_format: { userId, lessonId, format: d.format ?? 'default' } },
        update: {
          percent: d.percent,
          positionSeconds: d.positionSeconds,
          completedAt: d.percent === 100 ? new Date() : undefined,
        },
        create: {
          userId,
          workId: l.module.workId,
          lessonId,
          format: d.format ?? 'default',
          percent: d.percent,
          positionSeconds: d.positionSeconds,
          completedAt: d.percent === 100 ? new Date() : undefined,
        },
      });
      await tx.analyticsEvent.create({
        data: {
          userId,
          name: 'lesson.progressed',
          resourceType: 'lesson',
          resourceId: lessonId,
          properties: {
            workId: l.module.workId,
            percent: d.percent,
            format: d.format ?? 'default',
          },
        },
      });
      return progress;
    });
  }
  async complete(userId: string, lessonId: string) {
    const l = await this.lessonContext(lessonId);
    await this.require(userId, l.module.workId);
    return this.db.$transaction(async (tx) => {
      const progress = await tx.lessonProgress.upsert({
        where: { userId_lessonId_format: { userId, lessonId, format: 'default' } },
        update: { percent: 100, completedAt: new Date() },
        create: {
          userId,
          workId: l.module.workId,
          lessonId,
          percent: 100,
          completedAt: new Date(),
        },
      });
      await tx.analyticsEvent.create({
        data: {
          userId,
          name: 'lesson.completed',
          resourceType: 'lesson',
          resourceId: lessonId,
          properties: { workId: l.module.workId },
        },
      });
      return progress;
    });
  }
  async progressSummary(userId: string, workId?: string) {
    const rows = await this.db.lessonProgress.findMany({
      where: { userId, workId },
      include: { lesson: { select: { title: true, slug: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    const average = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length)
      : 0;
    return {
      workId,
      averagePercent: average,
      completedLessons: rows.filter((r) => r.percent === 100).length,
      lessons: rows,
    };
  }
  async grant(actorId: string, userId: string, workId: string, reason: string, expiresAt?: string) {
    const key = 'manual:' + userId + ':' + workId + ':' + Date.now();
    const e = await this.db.entitlement.create({
      data: {
        userId,
        workId,
        sourceType: 'MANUAL',
        sourceId: key,
        idempotencyKey: key,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    await this.db.auditEvent.create({
      data: {
        actorId,
        action: 'ENTITLEMENT_GRANTED',
        resourceType: 'entitlement',
        resourceId: e.id,
        reason,
      },
    });
    return e;
  }
  async revoke(actorId: string, id: string, reason: string) {
    const e = await this.db.entitlement.update({
      where: { id },
      data: { status: EntitlementStatus.REVOKED, revokedAt: new Date() },
    });
    await this.db.auditEvent.create({
      data: {
        actorId,
        action: 'ENTITLEMENT_REVOKED',
        resourceType: 'entitlement',
        resourceId: id,
        reason,
      },
    });
    return e;
  }
  async reconcile() {
    const paidWithoutGrant = await this.db.order.findMany({
      where: {
        status: 'PAID',
        items: { some: { product: { workId: { not: null } } } },
        payments: { some: { status: 'CAPTURED' } },
      },
      select: {
        id: true,
        userId: true,
        payments: { where: { status: 'CAPTURED' }, select: { id: true } },
        items: { select: { product: { select: { workId: true } } } },
      },
    });
    const mismatches = [];
    for (const o of paidWithoutGrant) {
      for (const p of o.payments) {
        for (const i of o.items) {
          if (i.product.workId) {
            const found = await this.db.entitlement.findFirst({
              where: { sourceId: p.id, workId: i.product.workId },
            });
            if (!found)
              mismatches.push({
                orderId: o.id,
                paymentId: p.id,
                workId: i.product.workId,
                userId: o.userId,
              });
          }
        }
      }
    }
    return { mismatchCount: mismatches.length, mismatches };
  }
}
