import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  ClaimReferralDto,
  CreateCampaignDto,
  CreateContentReportDto,
  CreateNotificationDto,
  CreateSupportCaseDto,
  ReasonDto,
  ResolveContentReportDto,
  UpdateSupportCaseDto,
} from './operations.dto';
import { OperationsService } from './operations.service';

@ApiTags('Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}
  @Post('support-cases') support(@CurrentUser() user: AuthUser, @Body() dto: CreateSupportCaseDto) {
    return this.operations.createCase(user.sub, dto);
  }
  @Get('me/support-cases') myCases(@CurrentUser() user: AuthUser) {
    return this.operations.myCases(user.sub);
  }
  @Post('content-reports') report(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContentReportDto,
  ) {
    return this.operations.report(user.sub, dto);
  }
  @Post('referrals/claim') referral(@CurrentUser() user: AuthUser, @Body() dto: ClaimReferralDto) {
    return this.operations.claimReferral(user.sub, dto.code);
  }
  @Get('me/referral') referralStatus(@CurrentUser() user: AuthUser) {
    return this.operations.referralStatus(user.sub);
  }
  @Get('me/notifications') notifications(@CurrentUser() user: AuthUser) {
    return this.operations.memberNotifications(user.sub, user.roles);
  }
}

@ApiTags('Admin Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin')
export class AdminOperationsController {
  constructor(private readonly operations: OperationsService) {}
  @Roles('admin')
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.operations.dashboard(user.roles);
  }
  @Roles('admin') @Get('users') users(@Query('q') q?: string) {
    return this.operations.users(q);
  }
  @Roles('admin') @Get('users/:id') user(@Param('id') id: string) {
    return this.operations.user(id);
  }
  @Roles('admin') @Post('users/:id/block') block(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.operations.block(user.sub, id, dto.reason);
  }
  @Roles('admin') @Post('users/:id/unblock') unblock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.operations.unblock(user.sub, id, dto.reason);
  }
  @Roles('admin')
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED'] })
  @Get('support-cases')
  cases(@Query('status') status?: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED') {
    return this.operations.cases(status);
  }
  @Roles('admin') @Patch('support-cases/:id') updateCase(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupportCaseDto,
  ) {
    return this.operations.updateCase(user.sub, id, dto);
  }
  @Roles('admin')
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'RESOLVED', 'DISMISSED'] })
  @Get('content-reports')
  reports(@Query('status') status?: 'OPEN' | 'RESOLVED' | 'DISMISSED') {
    return this.operations.reports(status);
  }
  @Roles('admin') @Post('content-reports/:id/resolve') resolve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResolveContentReportDto,
  ) {
    return this.operations.resolveReport(user.sub, id, dto);
  }
  @Roles('admin') @Get('notifications') notifications() {
    return this.operations.notifications();
  }
  @Roles('admin') @Post('notifications') notification(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.operations.createNotification(user.sub, dto);
  }
  @Roles('admin') @Post('campaigns') campaign(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.operations.createCampaign(user.sub, dto);
  }
  @Roles('admin') @Get('campaigns') campaigns() {
    return this.operations.campaigns();
  }
}
