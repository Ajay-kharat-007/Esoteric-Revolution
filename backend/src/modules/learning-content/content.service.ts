import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { MediaStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../database/prisma.service';
import { normalizeYouTubeUrl } from '../catalogue-admin/youtube.util';
import type {
  CompleteMediaDto,
  CreateLessonDto,
  CreateLessonVersionDto,
  CreateModuleDto,
  CreateWorkDto,
  CreateWorkVersionDto,
  PresignMediaDto,
  UpdateLessonDto,
  UpdateModuleDto,
  UpdateWorkDto,
} from './content.dto';
@Injectable()
export class ContentService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private async assertWriter(userId: string, workId: string, roles: string[]) {
    if (roles.includes('admin')) return;
    const found = await this.db.workAssignment.findUnique({
      where: { workId_userId: { workId, userId } },
    });
    if (!found) throw new ForbiddenException('Writer is not assigned to this work');
  }
  list() {
    return this.db.work.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        language: true,
        publishedVersion: true,
        _count: { select: { versions: true, modules: true } },
      },
    });
  }
  async create(userId: string, dto: CreateWorkDto) {
    const language = await this.db.language.findUnique({ where: { code: dto.languageCode } });
    if (!language) throw new NotFoundException('Language not found');
    return this.db.work.create({
      data: {
        slug: dto.slug,
        languageId: language.id,
        assignments: { create: { userId } },
        versions:
          dto.title && dto.summary
            ? { create: { version: 1, title: dto.title, summary: dto.summary } }
            : undefined,
      },
      include: { versions: true, assignments: true },
    });
  }
  async context(id: string) {
    const work = await this.db.work.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        assignments: { select: { userId: true } },
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
            },
          },
        },
      },
    });
    if (!work) throw new NotFoundException('Work not found');
    return work;
  }
  async update(userId: string, roles: string[], id: string, dto: UpdateWorkDto) {
    const existing = await this.db.work.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Work not found');
    await this.assertWriter(userId, id, roles);
    const { introductionVideoUrl, ...rest } = dto;
    const video =
      introductionVideoUrl === undefined ? undefined : normalizeYouTubeUrl(introductionVideoUrl);
    return this.db.work.update({
      where: { id },
      data: {
        ...rest,
        ...(video ? { introductionVideoUrl: video.url, introductionVideoId: video.id } : {}),
      },
    });
  }
  async workVersion(userId: string, roles: string[], id: string, dto: CreateWorkVersionDto) {
    await this.assertWriter(userId, id, roles);
    const last = await this.db.workVersion.findFirst({
      where: { workId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return this.db.workVersion.create({
      data: {
        workId: id,
        version: (last?.version ?? 0) + 1,
        title: dto.title,
        summary: dto.summary,
        subtitle: dto.subtitle,
        description: dto.description,
        content: dto.content as Prisma.InputJsonValue | undefined,
        preview: dto.preview as Prisma.InputJsonValue | undefined,
        searchText: [dto.title, dto.summary, dto.subtitle].filter(Boolean).join(' '),
      },
    });
  }
  async addModule(userId: string, roles: string[], workId: string, dto: CreateModuleDto) {
    await this.assertWriter(userId, workId, roles);
    return this.db.contentModule.create({ data: { workId, ...dto } });
  }
  async moduleWork(id: string) {
    const m = await this.db.contentModule.findUnique({ where: { id }, select: { workId: true } });
    if (!m) throw new NotFoundException('Module not found');
    return m.workId;
  }
  async updateModule(userId: string, roles: string[], id: string, dto: UpdateModuleDto) {
    await this.assertWriter(userId, await this.moduleWork(id), roles);
    return this.db.contentModule.update({ where: { id }, data: dto });
  }
  async lessonWork(id: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
      select: { module: { select: { workId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson.module.workId;
  }
  async addLesson(userId: string, roles: string[], moduleId: string, dto: CreateLessonDto) {
    await this.assertWriter(userId, await this.moduleWork(moduleId), roles);
    return this.db.lesson.create({ data: { moduleId, ...dto } });
  }
  async updateLesson(userId: string, roles: string[], id: string, dto: UpdateLessonDto) {
    await this.assertWriter(userId, await this.lessonWork(id), roles);
    return this.db.lesson.update({ where: { id }, data: dto });
  }
  async lessonContext(id: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
      include: {
        module: { select: { id: true, title: true, work: { select: { id: true, slug: true } } } },
        versions: { orderBy: { version: 'desc' }, include: { media: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
  async lessonVersion(userId: string, roles: string[], id: string, dto: CreateLessonVersionDto) {
    await this.assertWriter(userId, await this.lessonWork(id), roles);
    const last = await this.db.lessonVersion.findFirst({
      where: { lessonId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return this.db.lessonVersion.create({
      data: {
        lessonId: id,
        version: (last?.version ?? 0) + 1,
        content: dto.content as Prisma.InputJsonValue,
        transcript: dto.transcript,
        durationSeconds: dto.durationSeconds,
      },
    });
  }
  async presign(userId: string, dto: PresignMediaDto) {
    const safe = dto.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safe}`;
    const asset = await this.db.mediaAsset.create({
      data: {
        createdById: userId,
        lessonVersionId: dto.lessonVersionId,
        type: dto.type,
        originalFilename: dto.originalFilename,
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        checksumSha256: dto.checksumSha256.toLowerCase(),
        objectKey,
      },
    });
    const expiresAt = new Date(Date.now() + 15 * 60000);
    const signature = createHmac('sha256', this.config.getOrThrow<string>('auth.accessSecret'))
      .update(`${asset.id}:${expiresAt.toISOString()}`)
      .digest('hex');
    return {
      assetId: asset.id,
      method: 'PUT',
      uploadUrl: `http://localhost:3000/api/v1/admin/media/${asset.id}/upload-placeholder?expires=${encodeURIComponent(expiresAt.toISOString())}&signature=${signature}`,
      headers: { 'content-type': dto.mimeType, 'x-checksum-sha256': dto.checksumSha256 },
      expiresAt,
    };
  }
  async complete(userId: string, id: string, dto: CompleteMediaDto) {
    const asset = await this.db.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media not found');
    if (asset.createdById !== userId) throw new ForbiddenException('Media owner required');
    if (asset.status !== MediaStatus.PENDING_UPLOAD)
      throw new ConflictException('Media upload already completed');
    if (asset.checksumSha256 !== dto.checksumSha256.toLowerCase())
      throw new ConflictException('Checksum mismatch');
    const updated = await this.db.mediaAsset.update({
      where: { id },
      data: {
        status: MediaStatus.UPLOADED,
        uploadedAt: new Date(),
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return { ...updated, sizeBytes: updated.sizeBytes.toString() };
  }
  async uploadPlaceholder(
    userId: string,
    id: string,
    expires: string,
    signature: string,
    checksum: string,
  ) {
    const asset = await this.db.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.createdById !== userId)
      throw new ForbiddenException('Media owner required');
    if (new Date(expires).getTime() <= Date.now())
      throw new ConflictException('Upload URL expired');
    const expected = createHmac('sha256', this.config.getOrThrow<string>('auth.accessSecret'))
      .update(`${id}:${expires}`)
      .digest('hex');
    if (signature !== expected || checksum?.toLowerCase() !== asset.checksumSha256)
      throw new ConflictException('Invalid upload authorization');
    return { accepted: true, assetId: id };
  }
  async media() {
    const items = await this.db.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        objectKey: true,
        uploadedAt: true,
        createdAt: true,
      },
    });
    return items.map((item) => ({ ...item, sizeBytes: item.sizeBytes.toString() }));
  }
}
