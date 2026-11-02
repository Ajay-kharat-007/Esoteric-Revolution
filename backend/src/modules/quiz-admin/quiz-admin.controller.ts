import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  CreateQuizDto,
  CreateQuizQuestionDto,
  UpdateQuizDto,
  UpdateQuizQuestionDto,
} from './quiz-admin.dto';
import { QuizAdminService } from './quiz-admin.service';

@ApiTags('Admin Quiz Management')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class QuizAdminController {
  constructor(private readonly service: QuizAdminService) {}

  @Get('quizzes') quizzes() {
    return this.service.quizzes();
  }
  @Post('quizzes') createQuiz(@Body() dto: CreateQuizDto) {
    return this.service.createQuiz(dto);
  }
  @Get('quizzes/:id') quiz(@Param('id') id: string) {
    return this.service.quiz(id);
  }
  @Patch('quizzes/:id') updateQuiz(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.service.updateQuiz(id, dto);
  }
  @Delete('quizzes/:id') archiveQuiz(@Param('id') id: string) {
    return this.service.archiveQuiz(id);
  }
  @Post('quizzes/:id/questions') createQuestion(
    @Param('id') id: string,
    @Body() dto: CreateQuizQuestionDto,
  ) {
    return this.service.createQuestion(id, dto);
  }
  @Patch('quiz-questions/:id') updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.service.updateQuestion(id, dto);
  }
  @Delete('quiz-questions/:id') deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }
}
