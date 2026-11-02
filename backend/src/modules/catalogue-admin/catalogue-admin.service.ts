import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateCategoryDto,
  CreateContributorDto,
  CreateTopicDto,
  UpdateCategoryDto,
  UpdateContributorDto,
  UpdateTopicDto,
} from './catalogue-admin.dto';

@Injectable()
export class CatalogueAdminService {
  constructor(private readonly db: PrismaService) {}
  categories() {
    return this.db.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: { parent: true, _count: { select: { children: true, works: true } } },
    });
  }
  createCategory(dto: CreateCategoryDto) {
    return this.db.category.create({ data: dto });
  }
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    if (!(await this.db.category.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Category not found');
    return this.db.category.update({ where: { id }, data: dto });
  }
  async archiveCategory(id: string) {
    if (!(await this.db.category.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Category not found');
    return this.db.category.update({ where: { id }, data: { isPublished: false } });
  }
  topics() {
    return this.db.topic.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { works: true } } },
    });
  }
  createTopic(dto: CreateTopicDto) {
    return this.db.topic.create({ data: dto });
  }
  async updateTopic(id: string, dto: UpdateTopicDto) {
    if (!(await this.db.topic.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Topic not found');
    return this.db.topic.update({ where: { id }, data: dto });
  }
  async archiveTopic(id: string) {
    if (!(await this.db.topic.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Topic not found');
    return this.db.topic.update({ where: { id }, data: { isPublished: false } });
  }
  contributors() {
    return this.db.person.findMany({
      orderBy: { displayName: 'asc' },
      include: { _count: { select: { workCredits: true } } },
    });
  }
  createContributor(dto: CreateContributorDto) {
    return this.db.person.create({ data: dto });
  }
  async updateContributor(id: string, dto: UpdateContributorDto) {
    if (!(await this.db.person.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Contributor not found');
    return this.db.person.update({ where: { id }, data: dto });
  }
  async archiveContributor(id: string) {
    if (!(await this.db.person.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Contributor not found');
    return this.db.person.update({ where: { id }, data: { isPublic: false } });
  }
}
