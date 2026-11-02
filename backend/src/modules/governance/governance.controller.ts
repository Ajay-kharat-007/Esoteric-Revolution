import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import { AssignRolesDto, UpdateFeatureFlagDto } from './governance.dto';
import { GovernanceService } from './governance.service';

@ApiTags('Admin Governance & Reporting')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin')
export class GovernanceController {
  constructor(private readonly governance: GovernanceService) {}
  @Roles('admin') @Get('reports/overview') overview() {
    return this.governance.overview();
  }
  @Roles('admin') @Get('reports/commerce') commerce() {
    return this.governance.commerce();
  }
  @Roles('admin') @Get('reports/learning') learning() {
    return this.governance.learning();
  }
  @Roles('admin') @Get('audit-events') audit(
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.governance.audit(action, resourceType, resourceId);
  }
  @Roles('admin') @Get('roles') roles() {
    return this.governance.roles();
  }
  @Roles('admin') @Put('users/:id/roles') assign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.governance.assignRoles(user.sub, id, dto);
  }
  @Roles('admin') @Get('feature-flags') flags() {
    return this.governance.flags();
  }
  @Roles('admin') @Patch('feature-flags/:key') updateFlag(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.governance.updateFlag(user.sub, key, dto);
  }
}
