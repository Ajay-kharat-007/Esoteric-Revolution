import { Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, type AuthUser } from '../iam/auth.guard';
import { NotificationManagementService } from './notification-management.service';

@ApiTags('Learner Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('me/notifications')
export class NotificationManagementController {
  constructor(private readonly service: NotificationManagementService) {}

  @Patch(':id/read') markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markRead(id, user.sub, user.roles);
  }

  @Post('read-all') markAllRead(@CurrentUser() user: AuthUser) {
    return this.service.markAllRead(user.sub, user.roles);
  }

  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, user.sub, user.roles);
  }
}
