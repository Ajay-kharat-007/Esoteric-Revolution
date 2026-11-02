import type { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import type { PrismaService } from '../../database/prisma.service';
import type { RedisService } from '../../redis/redis.service';
describe('HealthService', () => {
  const prisma = { isHealthy: jest.fn().mockResolvedValue(true) };
  const redis = { ping: jest.fn().mockResolvedValue(true) };
  const config = {
    getOrThrow: jest.fn(
      (key: string) => ({ 'app.releaseVersion': 'test', 'app.environment': 'test' })[key],
    ),
  };
  const service = new HealthService(
    prisma as unknown as PrismaService,
    redis as unknown as RedisService,
    config as unknown as ConfigService,
  );
  it('returns liveness metadata', () =>
    expect(service.liveness()).toEqual({ status: 'ok', service: 'esoteric-library-backend' }));
  it('reports ready when dependencies respond', async () =>
    expect(service.readiness()).resolves.toEqual({
      status: 'ready',
      checks: { database: true, redis: true },
    }));
});
