import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/bootstrap';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/redis/redis.service';
describe('Foundation API (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true), $disconnect: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn().mockResolvedValue(true), onModuleDestroy: jest.fn() })
      .compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  afterAll(() => app.close());
  it('GET /health', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-correlation-id']).toBeDefined();
    expect(res.body.data.status).toBe('ok');
  });
  it('GET /health/ready', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(res.body.data).toEqual({ status: 'ready', checks: { database: true, redis: true } });
  });
  it('GET /version', async () => {
    const res = await request(app.getHttpServer()).get('/version').expect(200);
    expect(res.body.data).toMatchObject({ version: 'test', environment: 'test' });
  });
});
