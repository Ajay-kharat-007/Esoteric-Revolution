import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
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
import { ContentService } from './content.service';
@ApiTags('Admin Content Authoring')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class ContentController {
  constructor(private readonly content: ContentService) {}
  @Get('works') list() {
    return this.content.list();
  }
  @Post('works') create(@CurrentUser() u: AuthUser, @Body() d: CreateWorkDto) {
    return this.content.create(u.sub, d);
  }
  @Get('works/:id') context(@Param('id') id: string) {
    return this.content.context(id);
  }
  @Patch('works/:id') update(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: UpdateWorkDto,
  ) {
    return this.content.update(u.sub, u.roles, id, d);
  }
  @Post('works/:id/versions') version(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: CreateWorkVersionDto,
  ) {
    return this.content.workVersion(u.sub, u.roles, id, d);
  }
  @Post('works/:id/modules') module(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: CreateModuleDto,
  ) {
    return this.content.addModule(u.sub, u.roles, id, d);
  }
  @Patch('modules/:id') updateModule(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: UpdateModuleDto,
  ) {
    return this.content.updateModule(u.sub, u.roles, id, d);
  }
  @Post('modules/:id/lessons') lesson(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: CreateLessonDto,
  ) {
    return this.content.addLesson(u.sub, u.roles, id, d);
  }
  @Patch('lessons/:id') updateLesson(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: UpdateLessonDto,
  ) {
    return this.content.updateLesson(u.sub, u.roles, id, d);
  }
  @Get('lessons/:id') lessonContext(@Param('id') id: string) {
    return this.content.lessonContext(id);
  }
  @Post('lessons/:id/versions') lessonVersion(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: CreateLessonVersionDto,
  ) {
    return this.content.lessonVersion(u.sub, u.roles, id, d);
  }
  @Post('media/presign') presign(@CurrentUser() u: AuthUser, @Body() d: PresignMediaDto) {
    return this.content.presign(u.sub, d);
  }
  @Post('media/:id/complete') complete(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: CompleteMediaDto,
  ) {
    return this.content.complete(u.sub, id, d);
  }
  @Put('media/:id/upload-placeholder') upload(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Headers('x-checksum-sha256') checksum: string,
  ) {
    return this.content.uploadPlaceholder(u.sub, id, expires, signature, checksum);
  }
  @Get('media') media() {
    return this.content.media();
  }
}
