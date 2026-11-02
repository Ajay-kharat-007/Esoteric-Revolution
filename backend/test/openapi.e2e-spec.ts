import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/bootstrap';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { createOpenApiDocument } from '../src/swagger';
describe('OpenAPI contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ isHealthy: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn(), onModuleDestroy: jest.fn() })
      .compile();
    app = module.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  afterAll(() => app.close());
  it('documents Phase 0 endpoints', () => {
    const doc = createOpenApiDocument(app);
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining(['/health', '/health/ready', '/version']),
    );
    expect(doc.info.title).toBe('Esoteric Library API');
  });
});
