import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { AdminOperationsController, OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [IamModule],
  controllers: [OperationsController, AdminOperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
