import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import {
  CreateBookmarkDto,
  CreateHighlightDto,
  CreateNoteDto,
  RatingDto,
  ReflectionDto,
  SaveAnswerDto,
  UpdateHighlightDto,
  UpdateNoteDto,
} from './knowledge.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('Personal Knowledge & Assessment')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class KnowledgeController {
  constructor(private readonly k: KnowledgeService) {}
  @Get('me/bookmarks') bookmarks(@CurrentUser() u: AuthUser) {
    return this.k.bookmarks(u.sub);
  }
  @Post('lessons/:lessonId/bookmarks') bookmark(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
    @Body() d: CreateBookmarkDto,
  ) {
    return this.k.createBookmark(u.sub, id, d);
  }
  @Delete('bookmarks/:id') deleteBookmark(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.k.deleteBookmark(u.sub, id);
  }
  @Get('me/highlights') highlights(@CurrentUser() u: AuthUser) {
    return this.k.highlights(u.sub);
  }
  @Post('lessons/:lessonId/highlights') highlight(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
    @Body() d: CreateHighlightDto,
  ) {
    return this.k.createHighlight(u.sub, id, d);
  }
  @Patch('highlights/:id') updateHighlight(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: UpdateHighlightDto,
  ) {
    return this.k.updateHighlight(u.sub, id, d);
  }
  @Delete('highlights/:id') deleteHighlight(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.k.deleteHighlight(u.sub, id);
  }
  @Get('me/notes') notes(@CurrentUser() u: AuthUser, @Query('q') q?: string) {
    return this.k.notes(u.sub, q);
  }
  @Post('lessons/:lessonId/notes') note(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
    @Body() d: CreateNoteDto,
  ) {
    return this.k.createNote(u.sub, id, d);
  }
  @Patch('notes/:id') updateNote(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: UpdateNoteDto,
  ) {
    return this.k.updateNote(u.sub, id, d);
  }
  @Delete('notes/:id') deleteNote(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.k.deleteNote(u.sub, id);
  }
  @Get('me/reflections') reflections(@CurrentUser() u: AuthUser) {
    return this.k.reflections(u.sub);
  }
  @Post('lessons/:lessonId/reflections') reflection(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
    @Body() d: ReflectionDto,
  ) {
    return this.k.createReflection(u.sub, id, d);
  }
  @Patch('reflections/:id') updateReflection(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: ReflectionDto,
  ) {
    return this.k.updateReflection(u.sub, id, d);
  }
  @Delete('reflections/:id') deleteReflection(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.k.deleteReflection(u.sub, id);
  }
  @Get('quizzes/:quizId') quiz(@CurrentUser() u: AuthUser, @Param('quizId') id: string) {
    return this.k.quiz(u.sub, id);
  }
  @Post('quizzes/:quizId/attempts') attempt(
    @CurrentUser() u: AuthUser,
    @Param('quizId') id: string,
  ) {
    return this.k.attempt(u.sub, id);
  }
  @Post('quiz-attempts/:attemptId/answers') answer(
    @CurrentUser() u: AuthUser,
    @Param('attemptId') id: string,
    @Body() d: SaveAnswerDto,
  ) {
    return this.k.answer(u.sub, id, d);
  }
  @Post('quiz-attempts/:attemptId/submit') submit(
    @CurrentUser() u: AuthUser,
    @Param('attemptId') id: string,
  ) {
    return this.k.submit(u.sub, id);
  }
  @Get('quiz-attempts/:attemptId/result') result(
    @CurrentUser() u: AuthUser,
    @Param('attemptId') id: string,
  ) {
    return this.k.result(u.sub, id);
  }
  @Put('works/:workId/rating') rating(
    @CurrentUser() u: AuthUser,
    @Param('workId') id: string,
    @Body() d: RatingDto,
  ) {
    return this.k.rate(u.sub, id, d);
  }
  @Get('works/:workId/ratings') ratings(@CurrentUser() u: AuthUser, @Param('workId') id: string) {
    return this.k.ratings(u.sub, id);
  }
  @Delete('works/:workId/rating') deleteRating(
    @CurrentUser() u: AuthUser,
    @Param('workId') id: string,
  ) {
    return this.k.deleteRating(u.sub, id);
  }
}
