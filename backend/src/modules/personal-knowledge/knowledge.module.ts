import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { LearningDeliveryModule } from '../learning-delivery/learning.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [IamModule, LearningDeliveryModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class PersonalKnowledgeModule {}
