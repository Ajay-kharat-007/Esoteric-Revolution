import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { CatalogueAdminController } from './catalogue-admin.controller';
import { CatalogueAdminService } from './catalogue-admin.service';
@Module({
  imports: [IamModule],
  controllers: [CatalogueAdminController],
  providers: [CatalogueAdminService],
})
export class CatalogueAdminModule {}
