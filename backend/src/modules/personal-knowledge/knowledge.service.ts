import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { LearningService } from '../learning-delivery/learning.service';
import type {
  CreateBookmarkDto,
  CreateHighlightDto,
  CreateNoteDto,
  RatingDto,
  ReflectionDto,
  SaveAnswerDto,
  UpdateHighlightDto,
  UpdateNoteDto,
} from './knowledge.dto';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly db: PrismaService,
    private readonly learning: LearningService,
    private readonly config: ConfigService,
  ) {}
  private async lessonAccess(userId: string, lessonId: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      select: { module: { select: { workId: true } }, publishedVersionId: true },
    });
    if (!lesson?.publishedVersionId) throw new NotFoundException('Published lesson not found');
    await this.learning.require(userId, lesson.module.workId);
    return lesson.module.workId;
  }
  private async owned(
    model: 'bookmark' | 'highlight' | 'note' | 'reflection',
    id: string,
    userId: string,
  ) {
    let row: { userId: string } | null;
    if (model === 'bookmark')
      row = await this.db.bookmark.findUnique({ where: { id }, select: { userId: true } });
    else if (model === 'highlight')
      row = await this.db.highlight.findUnique({ where: { id }, select: { userId: true } });
    else if (model === 'note')
      row = await this.db.note.findUnique({ where: { id }, select: { userId: true } });
    else row = await this.db.reflection.findUnique({ where: { id }, select: { userId: true } });
    if (!row) throw new NotFoundException('Record not found');
    if (row.userId !== userId) throw new ForbiddenException('Record belongs to another user');
  }
  bookmarks(userId: string) {
    return this.db.bookmark.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            title: true,
            slug: true,
            summary: true,
            module: {
              select: {
                title: true,
                work: {
                  select: {
                    id: true,
                    slug: true,
                    publishedVersion: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async createBookmark(userId: string, lessonId: string, d: CreateBookmarkDto) {
    await this.lessonAccess(userId, lessonId);
    return this.db.bookmark.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { label: d.label, position: d.position as Prisma.InputJsonValue | undefined },
      create: {
        userId,
        lessonId,
        label: d.label,
        position: d.position as Prisma.InputJsonValue | undefined,
      },
    });
  }
  async deleteBookmark(userId: string, id: string) {
    await this.owned('bookmark', id, userId);
    await this.db.bookmark.delete({ where: { id } });
    return { deleted: true };
  }
  highlights(userId: string) {
    return this.db.highlight.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            title: true,
            slug: true,
            module: {
              select: {
                title: true,
                work: {
                  select: {
                    id: true,
                    slug: true,
                    publishedVersion: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async createHighlight(userId: string, lessonId: string, d: CreateHighlightDto) {
    await this.lessonAccess(userId, lessonId);
    return this.db.highlight.create({
      data: {
        userId,
        lessonId,
        quote: d.quote,
        range: d.range as Prisma.InputJsonValue,
        color: d.color,
      },
    });
  }
  async updateHighlight(userId: string, id: string, d: UpdateHighlightDto) {
    await this.owned('highlight', id, userId);
    return this.db.highlight.update({
      where: { id },
      data: { color: d.color, range: d.range as Prisma.InputJsonValue | undefined },
    });
  }
  async deleteHighlight(userId: string, id: string) {
    await this.owned('highlight', id, userId);
    await this.db.highlight.delete({ where: { id } });
    return { deleted: true };
  }
  notes(userId: string, query?: string) {
    return this.db.note.findMany({
      where: {
        userId,
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { body: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        lesson: {
          select: {
            title: true,
            slug: true,
            module: {
              select: {
                title: true,
                work: {
                  select: { id: true, slug: true, publishedVersion: { select: { title: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  async createNote(userId: string, lessonId: string, d: CreateNoteDto) {
    await this.lessonAccess(userId, lessonId);
    return this.db.note.create({ data: { userId, lessonId, ...d } });
  }
  async updateNote(userId: string, id: string, d: UpdateNoteDto) {
    await this.owned('note', id, userId);
    return this.db.note.update({ where: { id }, data: d });
  }
  async deleteNote(userId: string, id: string) {
    await this.owned('note', id, userId);
    await this.db.note.delete({ where: { id } });
    return { deleted: true };
  }
  private key() {
    return createHash('sha256')
      .update(this.config.getOrThrow<string>('security.encryptionMasterKey'))
      .digest();
  }
  private encrypt(body: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const ciphertext = Buffer.concat([cipher.update(body, 'utf8'), cipher.final()]);
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }
  private decrypt(r: { ciphertext: string; iv: string; authTag: string }) {
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(r.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(r.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(r.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
  async reflections(userId: string) {
    const rows = await this.db.reflection.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        lessonId: true,
        title: true,
        ciphertext: true,
        iv: true,
        authTag: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            title: true,
            slug: true,
            module: {
              select: {
                title: true,
                work: {
                  select: { id: true, slug: true, publishedVersion: { select: { title: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(({ ciphertext, iv, authTag, ...r }) => {
      try {
        return { ...r, body: this.decrypt({ ciphertext, iv, authTag }), decryptionFailed: false };
      } catch {
        return { ...r, body: null, decryptionFailed: true };
      }
    });
  }
  async createReflection(userId: string, lessonId: string, d: ReflectionDto) {
    await this.lessonAccess(userId, lessonId);
    const row = await this.db.reflection.create({
      data: { userId, lessonId, title: d.title, ...this.encrypt(d.body) },
      select: { id: true, lessonId: true, title: true, createdAt: true, updatedAt: true },
    });
    return { ...row, body: d.body };
  }
  async updateReflection(userId: string, id: string, d: ReflectionDto) {
    await this.owned('reflection', id, userId);
    const row = await this.db.reflection.update({
      where: { id },
      data: { title: d.title, ...this.encrypt(d.body) },
      select: { id: true, lessonId: true, title: true, createdAt: true, updatedAt: true },
    });
    return { ...row, body: d.body };
  }
  async deleteReflection(userId: string, id: string) {
    await this.owned('reflection', id, userId);
    await this.db.reflection.update({ where: { id }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }
  async quiz(userId: string, quizId: string) {
    const q = await this.db.quiz.findFirst({
      where: { id: quizId, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        workId: true,
        passingScore: true,
        questions: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            prompt: true,
            position: true,
            options: {
              orderBy: { position: 'asc' },
              select: { id: true, text: true, position: true },
            },
          },
        },
      },
    });
    if (!q) throw new NotFoundException('Quiz not found');
    await this.learning.require(userId, q.workId);
    return q;
  }
  async attempt(userId: string, quizId: string) {
    await this.quiz(userId, quizId);
    return this.db.quizAttempt.create({ data: { userId, quizId } });
  }
  private async ownedAttempt(userId: string, id: string) {
    const a = await this.db.quizAttempt.findUnique({ where: { id }, include: { quiz: true } });
    if (!a) throw new NotFoundException('Attempt not found');
    if (a.userId !== userId) throw new ForbiddenException('Attempt belongs to another user');
    return a;
  }
  async answer(userId: string, id: string, d: SaveAnswerDto) {
    const a = await this.ownedAttempt(userId, id);
    if (a.status === 'SUBMITTED') throw new BadRequestException('Attempt already submitted');
    const option = await this.db.quizOption.findFirst({
      where: { id: d.optionId, questionId: d.questionId, question: { quizId: a.quizId } },
    });
    if (!option) throw new BadRequestException('Question or option is not part of this quiz');
    return this.db.quizAnswer.upsert({
      where: { attemptId_questionId: { attemptId: id, questionId: d.questionId } },
      update: { optionId: d.optionId },
      create: { attemptId: id, questionId: d.questionId, optionId: d.optionId },
    });
  }
  async submit(userId: string, id: string) {
    const a = await this.ownedAttempt(userId, id);
    if (a.status === 'SUBMITTED') return this.result(userId, id);
    const questions = await this.db.quizQuestion.count({ where: { quizId: a.quizId } });
    if (!questions) throw new BadRequestException('Quiz has no questions');
    const correct = await this.db.quizAnswer.count({
      where: { attemptId: id, option: { isCorrect: true } },
    });
    const score = Math.round((correct * 100) / questions);
    await this.db.quizAttempt.update({
      where: { id },
      data: { status: 'SUBMITTED', score, submittedAt: new Date() },
    });
    return this.result(userId, id);
  }
  async result(userId: string, id: string) {
    const a = await this.ownedAttempt(userId, id);
    if (a.status !== 'SUBMITTED') throw new BadRequestException('Attempt has not been submitted');
    const answers = await this.db.quizAnswer.findMany({
      where: { attemptId: id },
      select: {
        questionId: true,
        optionId: true,
        option: { select: { isCorrect: true } },
        question: { select: { explanation: true } },
      },
    });
    return {
      attemptId: id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      workId: a.quiz.workId,
      passingScore: a.quiz.passingScore,
      score: a.score,
      passed: (a.score ?? 0) >= a.quiz.passingScore,
      submittedAt: a.submittedAt,
      answers: answers.map((x) => ({
        questionId: x.questionId,
        optionId: x.optionId,
        correct: x.option.isCorrect,
        explanation: x.question.explanation,
      })),
    };
  }
  async rate(userId: string, workId: string, d: RatingDto) {
    await this.learning.require(userId, workId);
    return this.db.rating.upsert({
      where: { userId_workId: { userId, workId } },
      update: d,
      create: { userId, workId, ...d },
    });
  }
  async ratings(userId: string, workId: string) {
    const work = await this.db.work.findUnique({ where: { id: workId }, select: { id: true } });
    if (!work) throw new NotFoundException('Work not found');
    const [own, aggregate, grouped, recent] = await this.db.$transaction([
      this.db.rating.findUnique({ where: { userId_workId: { userId, workId } } }),
      this.db.rating.aggregate({ where: { workId }, _avg: { value: true }, _count: true }),
      this.db.rating.groupBy({ by: ['value'], where: { workId }, _count: true }),
      this.db.rating.findMany({
        where: { workId, review: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { id: true, value: true, review: true, updatedAt: true },
      }),
    ]);
    return {
      own,
      average: aggregate._avg.value ?? 0,
      count: aggregate._count,
      distribution: Object.fromEntries(
        [1, 2, 3, 4, 5].map((value) => [
          value,
          grouped.find((x) => x.value === value)?._count ?? 0,
        ]),
      ),
      recent,
    };
  }
  async deleteRating(userId: string, workId: string) {
    const result = await this.db.rating.deleteMany({ where: { userId, workId } });
    if (!result.count) throw new NotFoundException('Rating not found');
    return { deleted: true };
  }
}
