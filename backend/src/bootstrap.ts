import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { setupSwagger } from './swagger';
import { Reflector } from '@nestjs/core';
import { MetricsInterceptor } from './modules/internal-operations/metrics.service';
export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({ origin: config.getOrThrow<string[]>('app.corsOrigins'), credentials: true });
  app.setGlobalPrefix(config.getOrThrow<string>('app.apiPrefix'), {
    exclude: [
      'health',
      'health/ready',
      'version',
      'docs',
      'docs/(.*)',
      'internal/(.*)',
      'webhooks/(.*)',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    app.get(MetricsInterceptor),
    new ResponseEnvelopeInterceptor(app.get(Reflector)),
  );
  app.enableShutdownHooks();
  if (config.get<boolean>('app.swaggerEnabled', true)) setupSwagger(app);
}
