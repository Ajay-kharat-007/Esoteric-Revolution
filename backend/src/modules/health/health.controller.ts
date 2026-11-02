import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
@ApiTags('System')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'The API process is alive.' })
  liveness() {
    return this.health.liveness();
  }
  @Get('health/ready')
  @ApiOperation({ summary: 'PostgreSQL and Redis readiness probe' })
  @ApiOkResponse({ description: 'All required dependencies are ready.' })
  readiness() {
    return this.health.readiness();
  }
  @Get('version')
  @ApiOperation({ summary: 'Build and environment metadata' })
  @ApiOkResponse({ description: 'Safe version metadata.' })
  version() {
    return this.health.version();
  }
}
