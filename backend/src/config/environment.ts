import { z } from 'zod';
const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    API_PREFIX: z.string().trim().min(1).default('api/v1'),
    APP_ORIGIN: z.url(),
    CORS_ORIGINS: z.string().trim().min(1),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.url(),
    DIRECT_DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    RELEASE_VERSION: z.string().default('local'),
    SWAGGER_ENABLED: booleanString.default(true),
    METRICS_ENABLED: booleanString,
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TOKEN_PEPPER: z.string().min(32),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    OTP_TTL_MINUTES: z.coerce.number().int().positive().max(30).default(10),
    PAYU_ENV: z.enum(['test', 'production']).default('test'),
    PAYU_KEY: z.string().min(1),
    PAYU_SALT: z.string().min(1),
    PAYU_BASE_URL: z.url(),
    PAYU_SUCCESS_URL: z.url(),
    PAYU_FAILURE_URL: z.url(),
    PAYU_WEBHOOK_SECRET: z.string().min(32),
    ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),
    INTERNAL_API_KEY: z.string().min(32).optional(),
    STORAGE_WEBHOOK_SECRET: z.string().min(32).optional(),
    EMAIL_WEBHOOK_SECRET: z.string().min(32).optional(),
    RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && !env.ENCRYPTION_MASTER_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['ENCRYPTION_MASTER_KEY'],
        message: 'A dedicated encryption key is required in production',
      });
    }
    for (const key of [
      'INTERNAL_API_KEY',
      'STORAGE_WEBHOOK_SECRET',
      'EMAIL_WEBHOOK_SECRET',
    ] as const) {
      if (env.NODE_ENV === 'production' && !env[key]) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });
export type Environment = z.infer<typeof environmentSchema>;
export function validateEnvironment(input: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success)
    throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
  return result.data;
}
