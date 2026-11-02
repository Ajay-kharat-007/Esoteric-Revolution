import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AssignRolesDto, UpdateFeatureFlagDto } from './governance.dto';

@Injectable()
export class GovernanceService {
  constructor(private readonly db: PrismaService) {}
  async overview() {
    const [
      users,
      activeUsers,
      publishedWorks,
      paidOrders,
      activeEntitlements,
      openSupportCases,
      openReports,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.user.count({ where: { status: 'ACTIVE' } }),
      this.db.work.count({ where: { status: 'PUBLISHED' } }),
      this.db.order.count({ where: { status: 'PAID' } }),
      this.db.entitlement.count({
        where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      this.db.supportCase.count({ where: { status: { in: ['OPEN', 'ASSIGNED'] } } }),
      this.db.contentReport.count({ where: { status: 'OPEN' } }),
    ]);
    return {
      generatedAt: new Date(),
      users,
      activeUsers,
      publishedWorks,
      paidOrders,
      activeEntitlements,
      openSupportCases,
      openReports,
    };
  }
  async commerce() {
    const [revenue, refunds, ordersByStatus, paymentsByStatus, capturedWithoutEntitlement] =
      await Promise.all([
        this.db.order.aggregate({
          where: { status: 'PAID' },
          _sum: { totalMinor: true },
          _count: true,
        }),
        this.db.refund.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amountMinor: true },
          _count: true,
        }),
        this.db.order.groupBy({ by: ['status'], _count: true }),
        this.db.payment.groupBy({ by: ['status'], _count: true }),
        this.db.payment.count({
          where: {
            status: 'CAPTURED',
            order: { items: { some: { product: { workId: { not: null } } } } },
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
      ]);
    return {
      currency: 'INR',
      paidOrderCount: revenue._count,
      revenueMinor: (revenue._sum.totalMinor ?? 0n).toString(),
      completedRefundCount: refunds._count,
      refundedMinor: (refunds._sum.amountMinor ?? 0n).toString(),
      ordersByStatus,
      paymentsByStatus,
      capturedWithoutEntitlement,
    };
  }
  async learning() {
    const [progress, completedLessons, learners, attempts, passedAttempts, events] =
      await Promise.all([
        this.db.lessonProgress.aggregate({ _count: true, _avg: { percent: true } }),
        this.db.lessonProgress.count({ where: { percent: 100 } }),
        this.db.lessonProgress.groupBy({ by: ['userId'] }),
        this.db.quizAttempt.count({ where: { status: 'SUBMITTED' } }),
        this.db.quizAttempt.count({ where: { status: 'SUBMITTED', score: { gte: 70 } } }),
        this.db.analyticsEvent.groupBy({ by: ['name'], _count: true }),
      ]);
    return {
      learnerCount: learners.length,
      progressRecords: progress._count,
      averageProgressPercent: Math.round(progress._avg.percent ?? 0),
      completedLessons,
      submittedQuizAttempts: attempts,
      passedQuizAttempts: passedAttempts,
      events,
    };
  }
  async audit(action?: string, resourceType?: string, resourceId?: string) {
    const events = await this.db.auditEvent.findMany({
      where: { action, resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const actorIds = [
      ...new Set(events.flatMap((event) => (event.actorId ? [event.actorId] : []))),
    ];
    const actors = await this.db.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, profile: { select: { displayName: true } } },
    });
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
    return events.map((event) => ({
      ...event,
      metadata: this.redactAuditMetadata(event.metadata),
      actor: event.actorId ? (actorMap.get(event.actorId) ?? null) : null,
    }));
  }
  private redactAuditMetadata(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redactAuditMetadata(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /(password|token|secret|signature|authorization|hash|otp|cookie)/i.test(key)
          ? '[REDACTED]'
          : this.redactAuditMetadata(item),
      ]),
    );
  }
  roles() {
    return this.db.role.findMany({
      include: {
        permissions: { select: { permission: { select: { code: true, description: true } } } },
        _count: { select: { users: true } },
      },
      orderBy: { code: 'asc' },
    });
  }
  async assignRoles(actorId: string, userId: string, dto: AssignRolesDto) {
    const allowedRoles = new Set(['admin', 'learner']);
    if (dto.roleCodes.length !== 1 || !dto.roleCodes.every((code) => allowedRoles.has(code))) {
      throw new BadRequestException('Exactly one role is required: admin or learner');
    }
    if (actorId === userId) throw new BadRequestException('Cannot change your own roles');
    const roles = await this.db.role.findMany({ where: { code: { in: dto.roleCodes } } });
    if (roles.length !== dto.roleCodes.length)
      throw new BadRequestException('One or more role codes are invalid');
    if (!(await this.db.user.findUnique({ where: { id: userId }, select: { id: true } })))
      throw new NotFoundException('User not found');
    return this.db.$transaction(async (tx) => {
      const before = await tx.userRole.findMany({ where: { userId }, include: { role: true } });
      await tx.userRole.deleteMany({ where: { userId } });
      if (roles.length)
        await tx.userRole.createMany({ data: roles.map((role) => ({ userId, roleId: role.id })) });
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      const auditEvent = await tx.auditEvent.create({
        data: {
          actorId,
          action: 'USER_ROLES_REPLACED',
          resourceType: 'user',
          resourceId: userId,
          reason: dto.reason,
          metadata: { before: before.map((x) => x.role.code), after: dto.roleCodes },
        },
      });
      return { userId, roles: dto.roleCodes, sessionsRevoked: true, auditEventId: auditEvent.id };
    });
  }
  flags() {
    return this.db.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }
  async updateFlag(actorId: string, key: string, dto: UpdateFeatureFlagDto) {
    const current = await this.db.featureFlag.findUnique({ where: { key } });
    if (!current) throw new NotFoundException('Feature flag not found');
    return this.db.$transaction(async (tx) => {
      const flag = await tx.featureFlag.update({
        where: { key },
        data: {
          enabled: dto.enabled,
          configuration: dto.configuration as Prisma.InputJsonValue | undefined,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: 'FEATURE_FLAG_UPDATED',
          resourceType: 'feature_flag',
          resourceId: key,
          reason: dto.reason,
          metadata: {
            before: { enabled: current.enabled, configuration: current.configuration },
            after: { enabled: flag.enabled, configuration: flag.configuration },
          },
        },
      });
      return flag;
    });
  }
}
