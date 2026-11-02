import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { AccountDeletionAdminController } from './account-deletion-admin.controller';
import { AccountDeletionAdminService } from './account-deletion-admin.service';

@Module({
  imports: [IamModule],
  controllers: [AccountDeletionAdminController],
  providers: [AccountDeletionAdminService],
})
export class AccountDeletionAdminModule {}
