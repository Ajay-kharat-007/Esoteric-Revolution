import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { EntitlementAdminController, LearningController } from './learning.controller';
import { LearningService } from './learning.service';
@Module({
  imports: [IamModule],
  controllers: [LearningController, EntitlementAdminController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningDeliveryModule {}
