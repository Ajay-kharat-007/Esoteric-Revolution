import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  CorrelationIdMiddleware,
  CORRELATION_ID_HEADER,
} from './common/middleware/correlation-id.middleware';
import { configuration } from './config/configuration';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { IamModule } from './modules/iam/iam.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { CatalogueAdminModule } from './modules/catalogue-admin/catalogue-admin.module';
import { ContentDiscoveryAdminModule } from './modules/content-discovery-admin/content-discovery-admin.module';
import { QuizAdminModule } from './modules/quiz-admin/quiz-admin.module';
import { NotificationManagementModule } from './modules/notification-management/notification-management.module';
import { AccountDeletionAdminModule } from './modules/account-deletion-admin/account-deletion-admin.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { ContentModule } from './modules/learning-content/content.module';
import { EditorialModule } from './modules/editorial-governance/editorial.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { PaymentModule } from './modules/payments/payment.module';
import { LearningDeliveryModule } from './modules/learning-delivery/learning.module';
import { PersonalKnowledgeModule } from './modules/personal-knowledge/knowledge.module';
import { OperationsModule } from './modules/operations/operations.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { InternalOperationsModule } from './modules/internal-operations/internal.module';
import { RedisModule } from './redis/redis.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('security.rateLimitTtlMs', 60000),
            limit: config.get<number>('security.rateLimitMax', 120),
          },
        ],
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('logging.level', 'info'),
          genReqId: (req) => req.headers[CORRELATION_ID_HEADER] as string,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
              'req.body.otp',
              'req.body.reflection',
              'req.body.body',
            ],
            censor: '[REDACTED]',
          },
          autoLogging: config.get<string>('app.environment') !== 'test',
        },
      }),
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    IamModule,
    CatalogueModule,
    CatalogueAdminModule,
    ContentDiscoveryAdminModule,
    QuizAdminModule,
    NotificationManagementModule,
    AccountDeletionAdminModule,
    PlatformSettingsModule,
    ContentModule,
    EditorialModule,
    CommerceModule,
    PaymentModule,
    LearningDeliveryModule,
    PersonalKnowledgeModule,
    OperationsModule,
    GovernanceModule,
    InternalOperationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
