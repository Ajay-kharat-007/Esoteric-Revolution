import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  CreateClaimDto,
  CreateRightsDto,
  CreateSourceDto,
  LinkSourceDto,
  ReasonDto,
  ReviewClaimDto,
  ScheduleDto,
  StartWorkflowDto,
  UpdateRightsDto,
  UpdateSourceDto,
  WorkflowActionDto,
} from './editorial.dto';
import { EditorialService } from './editorial.service';
@ApiTags('Admin Editorial Governance')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin')
export class EditorialController {
  constructor(private readonly e: EditorialService) {}
  @Roles('admin') @Post('sources') source(@Body() d: CreateSourceDto) {
    return this.e.createSource(d);
  }
  @Roles('admin') @Get('sources') sources() {
    return this.e.sources();
  }
  @Roles('admin') @Patch('sources/:id') updateSource(
    @Param('id') id: string,
    @Body() d: UpdateSourceDto,
  ) {
    return this.e.updateSource(id, d);
  }
  @Roles('admin') @Post('claims') claim(@Body() d: CreateClaimDto) {
    return this.e.createClaim(d);
  }
  @Roles('admin') @Get('claims') claims() {
    return this.e.claims();
  }
  @Roles('admin') @Patch('claims/:id') review(@Param('id') id: string, @Body() d: ReviewClaimDto) {
    return this.e.reviewClaim(id, d);
  }
  @Roles('admin') @Post('claims/:id/sources') link(
    @Param('id') id: string,
    @Body() d: LinkSourceDto,
  ) {
    return this.e.linkSource(id, d.sourceId, d.locator);
  }
  @Roles('admin') @Post('rights') rightsCreate(@Body() d: CreateRightsDto) {
    return this.e.createRights(d);
  }
  @Roles('admin') @Get('rights') rights() {
    return this.e.rights();
  }
  @Roles('admin') @Patch('rights/:id') rightsUpdate(
    @Param('id') id: string,
    @Body() d: UpdateRightsDto,
  ) {
    return this.e.updateRights(id, d);
  }
  @Roles('admin') @Get('rights/preflight/:workId') preflight(@Param('workId') id: string) {
    return this.e.preflight(id);
  }
  @Roles('admin') @Post('workflows') start(@Body() d: StartWorkflowDto) {
    return this.e.start(d);
  }
  @Roles('admin') @Get('workflows') workflows() {
    return this.e.workflows();
  }
  @Roles('admin') @Post('workflows/:id/actions') action(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body() d: WorkflowActionDto,
  ) {
    return this.e.action(id, u.sub, u.roles, d);
  }
  @Roles('admin') @Post('works/:id/submit-review') submit(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.e.submit(id, u.sub);
  }
  @Roles('admin') @Post('works/:id/schedule') schedule(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body() d: ScheduleDto,
  ) {
    return this.e.schedule(id, u.sub, new Date(d.publishAt));
  }
  @Roles('admin') @Post('works/:id/publish') publish(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
  ) {
    return this.e.publish(id, u.sub);
  }
  @Roles('admin') @Post('works/:id/archive') archive(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body() d: ReasonDto,
  ) {
    return this.e.archive(id, u.sub, d.reason);
  }
  @Roles('admin') @Post('works/:id/corrections') correction(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body() d: ReasonDto,
  ) {
    return this.e.correction(id, u.sub, d.reason);
  }
}
