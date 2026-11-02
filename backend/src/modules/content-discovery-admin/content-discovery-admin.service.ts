import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationStatus } from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateInsightDto,
  CreateLearningPathDto,
  LearningPathItemDto,
  UpdateInsightDto,
  UpdateLearningPathDto,
} from './content-discovery-admin.dto';

@Injectable()
export class ContentDiscoveryAdminService {
  constructor(private readonly db: PrismaService) {}

  learningPaths() {
    return this.db.learningPath.findMany({
      orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  }

  async learningPath(id: string) {
    const row = await this.db.learningPath.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            work: {
              select: {
                id: true,
                slug: true,
                status: true,
                publishedVersion: { select: { title: true } },
              },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Learning path not found');
    return row;
  }

  private async validateItems(items: LearningPathItemDto[]) {
    const positions = items.map((item) => item.position);
    if (new Set(positions).size !== positions.length)
      throw new BadRequestException('Learning path item positions must be unique');
    if (!items.length) return;
    const count = await this.db.work.count({
      where: { id: { in: items.map((item) => item.workId) } },
    });
    if (count !== items.length) throw new BadRequestException('One or more works do not exist');
  }

  async createLearningPath(dto: CreateLearningPathDto) {
    const { items = [], status = 'DRAFT', ...data } = dto;
    await this.validateItems(items);
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;
    return this.db.learningPath.create({
      data: {
        ...data,
        status: status,
        publishedAt,
        items: items.length ? { create: items } : undefined,
      },
      include: { items: { orderBy: { position: 'asc' } } },
    });
  }

  async updateLearningPath(id: string, dto: UpdateLearningPathDto) {
    const existing = await this.db.learningPath.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException('Learning path not found');
    const { items, status, ...data } = dto;
    if (items) await this.validateItems(items);
    const publishedAt =
      status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : status ? null : undefined;
    return this.db.$transaction(async (tx) => {
      if (items) {
        await tx.learningPathItem.deleteMany({ where: { pathId: id } });
        if (items.length)
          await tx.learningPathItem.createMany({
            data: items.map((item) => ({ pathId: id, ...item })),
          });
      }
      return tx.learningPath.update({
        where: { id },
        data: { ...data, status: status, publishedAt },
        include: { items: { orderBy: { position: 'asc' } } },
      });
    });
  }

  async archiveLearningPath(id: string) {
    if (!(await this.db.learningPath.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Learning path not found');
    return this.db.learningPath.update({
      where: { id },
      data: { status: PublicationStatus.ARCHIVED, publishedAt: null },
    });
  }

  insights() {
    return this.db.insight.findMany({ orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }] });
  }

  async insight(id: string) {
    const row = await this.db.insight.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Insight not found');
    return row;
  }

  createInsight(dto: CreateInsightDto) {
    const status = dto.status ?? 'DRAFT';
    return this.db.insight.create({
      data: {
        ...dto,
        body: dto.body as Prisma.InputJsonValue,
        status: status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async updateInsight(id: string, dto: UpdateInsightDto) {
    const existing = await this.db.insight.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException('Insight not found');
    const status = dto.status;
    return this.db.insight.update({
      where: { id },
      data: {
        ...dto,
        body: dto.body as Prisma.InputJsonValue,
        status: status,
        publishedAt:
          status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : status ? null : undefined,
      },
    });
  }

  async archiveInsight(id: string) {
    if (!(await this.db.insight.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Insight not found');
    return this.db.insight.update({
      where: { id },
      data: { status: PublicationStatus.ARCHIVED, publishedAt: null },
    });
  }
}
