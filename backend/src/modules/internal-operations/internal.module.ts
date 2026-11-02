import { Module } from '@nestjs/common';
import { InternalController, ProviderWebhookController } from './internal.controller';
import { InternalGuard } from './internal.guard';
import { InternalOperationsService } from './internal.service';
import { MetricsInterceptor, MetricsService } from './metrics.service';

@Module({
  controllers: [InternalController, ProviderWebhookController],
  providers: [InternalOperationsService, InternalGuard, MetricsService, MetricsInterceptor],
  exports: [InternalOperationsService, MetricsInterceptor],
})
export class InternalOperationsModule {}
