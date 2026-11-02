import type { Environment } from './environment';
export const configuration = () => {
  const env = process.env as unknown as Environment;
  return {
    app: {
      environment: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      origin: env.APP_ORIGIN,
      corsOrigins: env.CORS_ORIGINS.split(',').map((x) => x.trim()),
      releaseVersion: env.RELEASE_VERSION,
      swaggerEnabled: env.SWAGGER_ENABLED,
      metricsEnabled: env.METRICS_ENABLED,
    },
    database: { url: env.DATABASE_URL },
    redis: { url: env.REDIS_URL },
    logging: { level: env.LOG_LEVEL },
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshPepper: env.REFRESH_TOKEN_PEPPER,
      refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
      otpTtlMinutes: env.OTP_TTL_MINUTES,
    },
    payu: {
      environment: env.PAYU_ENV,
      key: env.PAYU_KEY,
      salt: env.PAYU_SALT,
      baseUrl: env.PAYU_BASE_URL,
      successUrl: env.PAYU_SUCCESS_URL,
      failureUrl: env.PAYU_FAILURE_URL,
      webhookSecret: env.PAYU_WEBHOOK_SECRET,
    },
    security: {
      encryptionMasterKey: env.ENCRYPTION_MASTER_KEY ?? env.JWT_ACCESS_SECRET,
      internalApiKey: env.INTERNAL_API_KEY ?? env.JWT_ACCESS_SECRET,
      storageWebhookSecret: env.STORAGE_WEBHOOK_SECRET ?? env.PAYU_WEBHOOK_SECRET,
      emailWebhookSecret: env.EMAIL_WEBHOOK_SECRET ?? env.PAYU_WEBHOOK_SECRET,
      rateLimitTtlMs: env.RATE_LIMIT_TTL_MS,
      rateLimitMax: env.RATE_LIMIT_MAX,
    },
  };
};
