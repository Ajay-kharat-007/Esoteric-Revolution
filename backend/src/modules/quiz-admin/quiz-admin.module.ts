import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { QuizAdminController } from './quiz-admin.controller';
import { QuizAdminService } from './quiz-admin.service';

@Module({
  imports: [IamModule],
  controllers: [QuizAdminController],
  providers: [QuizAdminService],
})
export class QuizAdminModule {}
