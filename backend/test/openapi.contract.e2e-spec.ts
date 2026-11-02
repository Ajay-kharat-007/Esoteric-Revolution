/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/bootstrap';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { createOpenApiDocument } from '../src/swagger';
describe('Complete OpenAPI contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const m = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ isHealthy: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn(), onModuleDestroy: jest.fn() })
      .compile();
    app = m.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  afterAll(() => app.close());
  it('has no empty request schemas and all refs resolve', () => {
    const d = createOpenApiDocument(app);
    const schemas = d.components?.schemas ?? {};
    const failures: string[] = [];
    for (const [path, item] of Object.entries(d.paths)) {
      for (const [method, op] of Object.entries(item ?? {})) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
        const schema = (op as any).requestBody?.content?.['application/json']?.schema;
        if (schema?.$ref) {
          const n = schema.$ref.split('/').pop();
          const target = (schemas as any)[n];
          if (!target) failures.push(`${method.toUpperCase()} ${path}: unresolved ${schema.$ref}`);
          else if (target.type === 'object' && Object.keys(target.properties ?? {}).length === 0)
            failures.push(`${method.toUpperCase()} ${path}: empty ${n}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
  it('documents checkout order body and optional contextual headers', () => {
    const d = createOpenApiDocument(app);
    expect(
      (d.paths['/api/v1/checkout/orders'] as any).post.requestBody.content['application/json']
        .schema.$ref,
    ).toContain('CheckoutOrderDto');
    const cart = (d.paths['/api/v1/carts/{id}'] as any).get.parameters.find(
      (p: any) => p.name === 'x-cart-token',
    );
    expect(cart.required).toBe(false);
  });
});
