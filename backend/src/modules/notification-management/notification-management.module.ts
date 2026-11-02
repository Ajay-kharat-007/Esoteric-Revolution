import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { NotificationManagementController } from './notification-management.controller';
import { NotificationManagementService } from './notification-management.service';

@Module({
  imports: [IamModule],
  controllers: [NotificationManagementController],
  providers: [NotificationManagementService],
})
export class NotificationManagementModule {}
