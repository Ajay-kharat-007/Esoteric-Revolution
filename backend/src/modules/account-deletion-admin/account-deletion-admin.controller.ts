import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeletionStatus } from '../../generated/prisma/enums';
import { AuthGuard } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import { RejectDeletionRequestDto } from './account-deletion-admin.dto';
import { AccountDeletionAdminService } from './account-deletion-admin.service';

@ApiTags('Admin Account Deletion')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/deletion-requests')
export class AccountDeletionAdminController {
  constructor(private readonly service: AccountDeletionAdminService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: DeletionStatus })
  requests(@Query('status') status?: DeletionStatus) {
    return this.service.requests(status);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDeletionRequestDto) {
    return this.service.reject(id, dto);
  }
}
