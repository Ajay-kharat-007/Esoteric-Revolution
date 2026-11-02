import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicationStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import type { CatalogueQueryDto, SearchQueryDto } from './catalogue.dto';
const published = {
  status: PublicationStatus.PUBLISHED,
  publishedVersionId: { not: null },
} as const;
@Injectable()
export class CatalogueService {
  constructor(private readonly db: PrismaService) {}
  private page<T>(items: T[], total: number, page: number, pageSize: number) {
    return { items, meta: { page, pageSize, total, hasNext: page * pageSize < total } };
  }
  async works(q: CatalogueQueryDto) {
    const where = {
      ...published,
      categories: q.category
        ? { some: { category: { slug: q.category, isPublished: true } } }
        : undefined,
      topics: q.topic ? { some: { topic: { slug: q.topic, isPublished: true } } } : undefined,
      language: q.language ? { code: q.language, isActive: true } : undefined,
    };
    const [items, total] = await this.db.$transaction([
      this.db.work.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy:
          q.sort === 'title' ? { publishedVersion: { title: 'asc' } } : { publishedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          publishedAt: true,
          language: { select: { code: true, name: true } },
          publishedVersion: {
            select: { title: true, subtitle: true, summary: true, coverImageUrl: true },
          },
          people: {
            orderBy: { position: 'asc' },
            select: { role: true, person: { select: { slug: true, displayName: true } } },
          },
          categories: { select: { category: { select: { slug: true, name: true } } } },
          topics: { select: { topic: { select: { slug: true, name: true } } } },
        },
      }),
      this.db.work.count({ where }),
    ]);
    return this.page(items, total, q.page, q.pageSize);
  }
  async work(slug: string) {
    const item = await this.db.work.findFirst({
      where: { slug, ...published },
      select: {
        id: true,
        slug: true,
        introductionVideoUrl: true,
        introductionVideoId: true,
        introductionVideoTitle: true,
        introductionVideoCaptionInfo: true,
        publishedAt: true,
        language: { select: { code: true, name: true } },
        publishedVersion: {
          select: {
            title: true,
            subtitle: true,
            summary: true,
            description: true,
            coverImageUrl: true,
          },
        },
        people: {
          orderBy: { position: 'asc' },
          select: { role: true, person: { select: { slug: true, displayName: true } } },
        },
        categories: { select: { category: { select: { slug: true, name: true } } } },
        topics: { select: { topic: { select: { slug: true, name: true } } } },
      },
    });
    if (!item) throw new NotFoundException('Work not found');
    return item;
  }
  async preview(slug: string) {
    const item = await this.db.work.findFirst({
      where: { slug, ...published },
      select: {
        id: true,
        slug: true,
        publishedVersion: { select: { title: true, preview: true } },
      },
    });
    if (!item) throw new NotFoundException('Work not found');
    return item;
  }
  async references(slug: string) {
    const item = await this.db.work.findFirst({
      where: { slug, ...published },
      select: {
        id: true,
        slug: true,
        publishedVersion: { select: { title: true, references: true } },
      },
    });
    if (!item) throw new NotFoundException('Work not found');
    return item;
  }
  categories() {
    return this.db.category.findMany({
      where: { isPublished: true, parentId: null },
      orderBy: { position: 'asc' },
      include: { children: { where: { isPublished: true }, orderBy: { position: 'asc' } } },
    });
  }
  async category(slug: string) {
    const item = await this.db.category.findFirst({
      where: { slug, isPublished: true },
      include: {
        children: { where: { isPublished: true }, orderBy: { position: 'asc' } },
        works: {
          where: { work: published },
          take: 20,
          select: {
            work: {
              select: {
                slug: true,
                publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }
  topics() {
    return this.db.topic.findMany({ where: { isPublished: true }, orderBy: { name: 'asc' } });
  }
  async topic(slug: string) {
    const item = await this.db.topic.findFirst({
      where: { slug, isPublished: true },
      include: {
        works: {
          where: { work: published },
          take: 20,
          select: {
            work: {
              select: {
                slug: true,
                publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Topic not found');
    return item;
  }
  async person(slug: string) {
    const item = await this.db.person.findFirst({
      where: { slug, isPublic: true },
      include: {
        workCredits: {
          where: { work: published },
          select: {
            role: true,
            work: {
              select: { slug: true, publishedVersion: { select: { title: true, summary: true } } },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Person not found');
    return item;
  }
  paths() {
    return this.db.learningPath.findMany({
      where: { status: PublicationStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
      },
    });
  }
  async path(slug: string) {
    const item = await this.db.learningPath.findFirst({
      where: { slug, status: PublicationStatus.PUBLISHED },
      include: {
        items: {
          orderBy: { position: 'asc' },
          where: { work: published },
          select: {
            position: true,
            work: {
              select: { slug: true, publishedVersion: { select: { title: true, summary: true } } },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Learning path not found');
    return item;
  }
  async insights(page = 1, pageSize = 20) {
    const where = { status: PublicationStatus.PUBLISHED };
    const [items, total] = await this.db.$transaction([
      this.db.insight.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { slug: true, title: true, excerpt: true, publishedAt: true },
      }),
      this.db.insight.count({ where }),
    ]);
    return this.page(items, total, page, pageSize);
  }
  async insight(slug: string) {
    const item = await this.db.insight.findFirst({
      where: { slug, status: PublicationStatus.PUBLISHED },
    });
    if (!item) throw new NotFoundException('Insight not found');
    return item;
  }
  async search(q: SearchQueryDto) {
    const where = {
      ...published,
      OR: [
        { slug: { contains: q.q, mode: 'insensitive' as const } },
        {
          publishedVersion: {
            is: {
              OR: [
                { title: { contains: q.q, mode: 'insensitive' as const } },
                { summary: { contains: q.q, mode: 'insensitive' as const } },
                { searchText: { contains: q.q, mode: 'insensitive' as const } },
              ],
            },
          },
        },
      ],
    };
    const [items, total] = await this.db.$transaction([
      this.db.work.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { publishedAt: 'desc' },
        select: {
          slug: true,
          publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
        },
      }),
      this.db.work.count({ where }),
    ]);
    return this.page(items, total, q.page, q.pageSize);
  }
  async home() {
    const [featured, paths, insights, categories] = await Promise.all([
      this.db.work.findMany({
        where: published,
        orderBy: { publishedAt: 'desc' },
        take: 8,
        select: {
          slug: true,
          publishedVersion: { select: { title: true, summary: true, coverImageUrl: true } },
        },
      }),
      this.db.learningPath.findMany({
        where: { status: PublicationStatus.PUBLISHED },
        take: 4,
        orderBy: { publishedAt: 'desc' },
      }),
      this.db.insight.findMany({
        where: { status: PublicationStatus.PUBLISHED },
        take: 4,
        orderBy: { publishedAt: 'desc' },
        select: { slug: true, title: true, excerpt: true, publishedAt: true },
      }),
      this.db.category.findMany({
        where: { isPublished: true, parentId: null },
        orderBy: { position: 'asc' },
      }),
    ]);
    return { featured, learningPaths: paths, insights, categories };
  }
}
