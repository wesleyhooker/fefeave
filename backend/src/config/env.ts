import { z } from 'zod';
import { APP_ROLE_VALUES } from '../auth/types';

const authModeEnum = z.enum(['off', 'dev_bypass', 'cognito']);

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_PREFIX: z.string().default('/api'),
  AUTH_MODE: authModeEnum.default('off'),
  // Dev bypass (required when AUTH_MODE=dev_bypass)
  AUTH_DEV_BYPASS_USER_ID: z.string().optional(),
  AUTH_DEV_BYPASS_EMAIL: z.string().email().optional(),
  AUTH_DEV_BYPASS_ROLE: z.enum(APP_ROLE_VALUES).optional(),
  // Explicit opt-in to allow x-dev-user header override (security: default off)
  AUTH_DEV_ALLOW_HEADER_OVERRIDE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  // Cognito (required when AUTH_MODE=cognito)
  COGNITO_REGION: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_APP_CLIENT_ID: z.string().optional(),
  // Database: DATABASE_URL (preferred) or split vars
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  // S3 attachments bucket (Epic 2.1; wire to Terraform output in deployment)
  S3_ATTACHMENTS_BUCKET: z.string().min(1).optional(),
  AWS_REGION: z.string().optional().default('us-east-1'),
});

export type Env = z.infer<typeof baseEnvSchema>;

const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  if (data.AUTH_MODE === 'dev_bypass') {
    if (!data.AUTH_DEV_BYPASS_USER_ID)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_DEV_BYPASS_USER_ID required when AUTH_MODE=dev_bypass',
        path: ['AUTH_DEV_BYPASS_USER_ID'],
      });
    if (!data.AUTH_DEV_BYPASS_EMAIL)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_DEV_BYPASS_EMAIL required when AUTH_MODE=dev_bypass',
        path: ['AUTH_DEV_BYPASS_EMAIL'],
      });
    if (!data.AUTH_DEV_BYPASS_ROLE)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_DEV_BYPASS_ROLE required when AUTH_MODE=dev_bypass',
        path: ['AUTH_DEV_BYPASS_ROLE'],
      });
  }
  // Database: require all split vars if any is set (DB_PASSWORD can be empty)
  const hasAnyDbSplit =
    data.DB_HOST || data.DB_PORT || data.DB_NAME || data.DB_USER || data.DB_PASSWORD;
  const hasAllDbSplit =
    !!data.DB_HOST?.trim() && !!data.DB_PORT && !!data.DB_NAME?.trim() && !!data.DB_USER?.trim();
  if (hasAnyDbSplit && !data.DATABASE_URL && !hasAllDbSplit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'When using split DB vars, all of DB_HOST, DB_PORT, DB_NAME, DB_USER are required',
      path: ['DB_HOST'],
    });
  }

  if (data.AUTH_MODE === 'cognito') {
    if (!data.COGNITO_REGION)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COGNITO_REGION required when AUTH_MODE=cognito',
        path: ['COGNITO_REGION'],
      });
    if (!data.COGNITO_USER_POOL_ID)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COGNITO_USER_POOL_ID required when AUTH_MODE=cognito',
        path: ['COGNITO_USER_POOL_ID'],
      });
    if (!data.COGNITO_APP_CLIENT_ID)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COGNITO_APP_CLIENT_ID required when AUTH_MODE=cognito',
        path: ['COGNITO_APP_CLIENT_ID'],
      });
  }
});

let env: Env;

export function loadEnv(): Env {
  if (env) {
    return env;
  }

  try {
    env = envSchema.parse(process.env) as Env;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid environment configuration: ${missing}`);
    }
    throw error;
  }
}

export function getEnv(): Env {
  if (!env) {
    return loadEnv();
  }
  return env;
}

/** Build database URL from env. Returns null if no DB config. */
export function getDatabaseUrl(): string | null {
  const e = getEnv();
  if (e.DATABASE_URL) return e.DATABASE_URL;
  if (e.DB_HOST?.trim() && e.DB_PORT && e.DB_NAME?.trim() && e.DB_USER?.trim()) {
    const user = encodeURIComponent(e.DB_USER.trim());
    const password = encodeURIComponent(e.DB_PASSWORD ?? '');
    return `postgres://${user}:${password}@${e.DB_HOST.trim()}:${e.DB_PORT}/${e.DB_NAME.trim()}`;
  }
  return null;
}

/** Reset cached env so loadEnv() re-reads process.env. For tests only. */
export function clearEnvCache(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (env as any) = undefined;
}
