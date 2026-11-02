import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}
  liveness() {
    return { status: 'ok', service: 'esoteric-library-backend' };
  }
  version() {
    return {
      service: 'esoteric-library-backend',
      version: this.config.getOrThrow<string>('app.releaseVersion'),
      environment: this.config.getOrThrow<string>('app.environment'),
    };
  }
  async readiness() {
    const [database, redis] = await Promise.all([this.prisma.isHealthy(), this.redis.ping()]);
    return { status: database && redis ? 'ready' : 'not_ready', checks: { database, redis } };
  }
}
