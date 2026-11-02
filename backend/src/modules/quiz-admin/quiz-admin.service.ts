import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateQuizDto,
  CreateQuizQuestionDto,
  QuizOptionInputDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from './quiz-admin.dto';

@Injectable()
export class QuizAdminService {
  constructor(private readonly db: PrismaService) {}

  quizzes() {
    return this.db.quiz.findMany({
      orderBy: { title: 'asc' },
      include: {
        work: { select: { id: true, slug: true, publishedVersion: { select: { title: true } } } },
        lesson: { select: { id: true, slug: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  async quiz(id: string) {
    const row = await this.db.quiz.findUnique({
      where: { id },
      include: {
        work: { select: { id: true, slug: true, publishedVersion: { select: { title: true } } } },
        lesson: { select: { id: true, slug: true, title: true } },
        questions: {
          orderBy: { position: 'asc' },
          include: { options: { orderBy: { position: 'asc' } } },
        },
        _count: { select: { attempts: true } },
      },
    });
    if (!row) throw new NotFoundException('Quiz not found');
    return row;
  }

  private async validateQuizTargets(workId: string, lessonId?: string) {
    const work = await this.db.work.findUnique({ where: { id: workId }, select: { id: true } });
    if (!work) throw new BadRequestException('Work does not exist');
    if (lessonId) {
      const lesson = await this.db.lesson.findFirst({
        where: { id: lessonId, module: { workId } },
        select: { id: true },
      });
      if (!lesson) throw new BadRequestException('Lesson does not belong to the selected work');
    }
  }

  createQuiz(dto: CreateQuizDto) {
    return this.validateQuizTargets(dto.workId, dto.lessonId).then(() =>
      this.db.quiz.create({
        data: {
          workId: dto.workId,
          lessonId: dto.lessonId,
          title: dto.title,
          description: dto.description,
          passingScore: dto.passingScore ?? 70,
          isActive: dto.isActive ?? true,
        },
      }),
    );
  }

  async updateQuiz(id: string, dto: UpdateQuizDto) {
    const existing = await this.db.quiz.findUnique({
      where: { id },
      select: { id: true, workId: true, lessonId: true },
    });
    if (!existing) throw new NotFoundException('Quiz not found');
    const workId = dto.workId ?? existing.workId;
    const lessonId = dto.lessonId ?? existing.lessonId ?? undefined;
    await this.validateQuizTargets(workId, lessonId);
    return this.db.quiz.update({ where: { id }, data: dto });
  }

  async archiveQuiz(id: string) {
    if (!(await this.db.quiz.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Quiz not found');
    return this.db.quiz.update({ where: { id }, data: { isActive: false } });
  }

  private validateOptions(options: QuizOptionInputDto[]) {
    const positions = options.map((option) => option.position);
    if (new Set(positions).size !== positions.length)
      throw new BadRequestException('Quiz option positions must be unique');
    if (options.filter((option) => option.isCorrect).length < 1)
      throw new BadRequestException('At least one quiz option must be correct');
  }

  async createQuestion(quizId: string, dto: CreateQuizQuestionDto) {
    if (!(await this.db.quiz.findUnique({ where: { id: quizId }, select: { id: true } })))
      throw new NotFoundException('Quiz not found');
    this.validateOptions(dto.options);
    return this.db.quizQuestion.create({
      data: {
        quizId,
        prompt: dto.prompt,
        explanation: dto.explanation,
        position: dto.position,
        options: {
          create: dto.options.map((option) => ({
            ...option,
            isCorrect: option.isCorrect ?? false,
          })),
        },
      },
      include: { options: { orderBy: { position: 'asc' } } },
    });
  }

  async updateQuestion(id: string, dto: UpdateQuizQuestionDto) {
    const current = await this.db.quizQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new NotFoundException('Quiz question not found');
    if (dto.options) this.validateOptions(dto.options);
    const { options, ...data } = dto;
    return this.db.$transaction(async (tx) => {
      if (options) {
        const answerCount = await tx.quizAnswer.count({ where: { questionId: id } });
        if (answerCount)
          throw new ConflictException('Cannot replace options after answers have been submitted');
        await tx.quizOption.deleteMany({ where: { questionId: id } });
        await tx.quizOption.createMany({
          data: options.map((option) => ({
            questionId: id,
            ...option,
            isCorrect: option.isCorrect ?? false,
          })),
        });
      }
      return tx.quizQuestion.update({
        where: { id },
        data,
        include: { options: { orderBy: { position: 'asc' } } },
      });
    });
  }

  async deleteQuestion(id: string) {
    const row = await this.db.quizQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('Quiz question not found');
    const answerCount = await this.db.quizAnswer.count({ where: { questionId: id } });
    if (answerCount)
      throw new ConflictException('Cannot delete a question after answers have been submitted');
    await this.db.quizQuestion.delete({ where: { id } });
    return { id, deleted: true };
  }
}
