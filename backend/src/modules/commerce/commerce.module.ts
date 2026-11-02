import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { AdminCommerceController, CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';
@Module({
  imports: [IamModule],
  controllers: [CommerceController, AdminCommerceController],
  providers: [CommerceService],
  exports: [CommerceService],
})
export class CommerceModule {}
