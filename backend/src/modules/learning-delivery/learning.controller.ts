import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import { GrantEntitlementDto, ProgressDto, RevokeEntitlementDto } from './learning.dto';
import { LearningService } from './learning.service';
@ApiTags('Learning Delivery')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class LearningController {
  constructor(private readonly l: LearningService) {}
  @Get('me/entitlements') entitlements(@CurrentUser() u: AuthUser) {
    return this.l.entitlements(u.sub);
  }
  @Get('access/works/:workId') access(@CurrentUser() u: AuthUser, @Param('workId') id: string) {
    return this.l.decision(u.sub, id);
  }
  @Get('me/library') library(@CurrentUser() u: AuthUser) {
    return this.l.library(u.sub);
  }
  @Get('learn/works/:workId') work(@CurrentUser() u: AuthUser, @Param('workId') id: string) {
    return this.l.work(u.sub, id);
  }
  @Get('learn/lessons/:lessonId') lesson(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
  ) {
    return this.l.lesson(u.sub, id);
  }
  @Get('learn/lessons/:lessonId/media') media(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
  ) {
    return this.l.media(u.sub, id);
  }
  @Get('learn/lessons/:lessonId/transcript') transcript(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
  ) {
    return this.l.transcript(u.sub, id);
  }
  @Put('learn/lessons/:lessonId/progress') progress(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
    @Body() d: ProgressDto,
  ) {
    return this.l.progress(u.sub, id, d);
  }
  @Post('learn/lessons/:lessonId/complete') complete(
    @CurrentUser() u: AuthUser,
    @Param('lessonId') id: string,
  ) {
    return this.l.complete(u.sub, id);
  }
  @Get('me/progress') summary(@CurrentUser() u: AuthUser) {
    return this.l.progressSummary(u.sub);
  }
  @Get('me/progress/:workId') workProgress(
    @CurrentUser() u: AuthUser,
    @Param('workId') id: string,
  ) {
    return this.l.progressSummary(u.sub, id);
  }
}
@ApiTags('Admin Entitlements')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller()
export class EntitlementAdminController {
  constructor(private readonly l: LearningService) {}
  @Post('admin/entitlements') grant(@CurrentUser() u: AuthUser, @Body() d: GrantEntitlementDto) {
    return this.l.grant(u.sub, d.userId, d.workId, d.reason, d.expiresAt);
  }
  @Post('admin/entitlements/:id/revoke') revoke(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body() d: RevokeEntitlementDto,
  ) {
    return this.l.revoke(u.sub, id, d.reason);
  }
  @Post('internal/entitlements/reconcile') reconcile() {
    return this.l.reconcile();
  }
}
