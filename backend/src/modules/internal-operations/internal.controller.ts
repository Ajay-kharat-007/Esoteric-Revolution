import { Body, Controller, Get, Header, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { SkipResponseEnvelope } from '../../common/interceptors/response-envelope.interceptor';
import { EmailWebhookDto, StorageWebhookDto } from './internal.dto';
import { InternalGuard } from './internal.guard';
import { InternalOperationsService } from './internal.service';

@ApiTags('Internal Operations')
@ApiHeader({ name: 'x-internal-key', required: true })
@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly operations: InternalOperationsService) {}
  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4')
  @SkipResponseEnvelope()
  metrics() {
    return this.operations.prometheus();
  }
  @Post('jobs/retry/:jobId') retry(@Param('jobId') id: string) {
    return this.operations.retry(id);
  }
  @Post('outbox/process') process() {
    return this.operations.processOutbox();
  }
}

@ApiTags('Provider Webhooks')
@Controller('webhooks')
export class ProviderWebhookController {
  constructor(private readonly operations: InternalOperationsService) {}
  @Post('storage') storage(
    @Body() body: StorageWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.operations.storage(body, signature);
  }
  @Post('email') email(
    @Body() body: EmailWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.operations.email(body, signature);
  }
}
