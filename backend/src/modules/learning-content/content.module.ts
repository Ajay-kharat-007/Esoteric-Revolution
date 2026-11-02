import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
@Module({
  imports: [IamModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
