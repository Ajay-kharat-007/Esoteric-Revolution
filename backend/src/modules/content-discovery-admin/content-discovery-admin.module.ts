import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { ContentDiscoveryAdminController } from './content-discovery-admin.controller';
import { ContentDiscoveryAdminService } from './content-discovery-admin.service';

@Module({
  imports: [IamModule],
  controllers: [ContentDiscoveryAdminController],
  providers: [ContentDiscoveryAdminService],
})
export class ContentDiscoveryAdminModule {}
