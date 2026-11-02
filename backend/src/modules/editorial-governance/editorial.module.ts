import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { EditorialController } from './editorial.controller';
import { EditorialService } from './editorial.service';
@Module({
  imports: [IamModule],
  controllers: [EditorialController],
  providers: [EditorialService],
  exports: [EditorialService],
})
export class EditorialModule {}
