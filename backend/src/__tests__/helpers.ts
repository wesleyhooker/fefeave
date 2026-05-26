import { execSync } from 'child_process';
import path from 'path';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../index';
import { clearEnvCache } from '../config/env';

/** Isolated schema for integration tests (see run-integration-tests.sh). */
export const TEST_SCHEMA = 'test';

/** True when URL uses Neon PgBouncer pooler (cannot set search_path via PGOPTIONS). */
export function isNeonPoolerDatabaseUrl(databaseUrl: string): boolean {
  return databaseUrl.includes('-pooler.');
}

/**
 * Env for integration tests: DATABASE_URL + PGOPTIONS search_path=test.
 * Neon pooler endpoints reject startup options — use the direct (non-pooler) connection string.
 */
export function integrationTestDatabaseEnv(
  databaseUrl: string
): Pick<TestEnvOverrides, 'DATABASE_URL' | 'PGOPTIONS'> {
  if (isNeonPoolerDatabaseUrl(databaseUrl)) {
    throw new Error(
      'Neon pooler DATABASE_URL cannot run integration tests (search_path rejected). ' +
        'Use the direct connection string from the Neon dashboard (host without -pooler). ' +
        'See docs/deployment/neon-phase1.md.'
    );
  }
  return {
    DATABASE_URL: databaseUrl,
    PGOPTIONS: '-c search_path=test',
  };
}

/** Run node-pg-migrate into TEST_SCHEMA; requires --tsx (ESM migration files). */
export function runTestSchemaMigrations(databaseUrl: string): void {
  execSync(
    `npx node-pg-migrate --tsx up -m migrations -s ${TEST_SCHEMA} --create-schema --create-migrations-schema`,
    {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
    }
  );
}

/** Env overrides for tests. Only set keys you need; rest come from process.env or defaults. */
export type TestEnvOverrides = Partial<{
  NODE_ENV: string;
  PORT: string;
  LOG_LEVEL: string;
  API_PREFIX: string;
  AUTH_MODE: string;
  AUTH_DEV_BYPASS_USER_ID: string;
  AUTH_DEV_BYPASS_EMAIL: string;
  AUTH_DEV_BYPASS_ROLE: string;
  AUTH_DEV_ALLOW_HEADER_OVERRIDE: string;
  COGNITO_REGION: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_APP_CLIENT_ID: string;
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  PGOPTIONS: string;
  S3_ATTACHMENTS_BUCKET: string;
  AWS_REGION: string;
}>;

export type BuildAppResult = {
  app: FastifyInstance;
  restoreEnv: () => void;
};

function uniqueTestSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildUniqueDevBypassIdentity(
  label: string,
  role: 'ADMIN' | 'OPERATOR' | 'WHOLESALER'
): Pick<
  TestEnvOverrides,
  'AUTH_DEV_BYPASS_USER_ID' | 'AUTH_DEV_BYPASS_EMAIL' | 'AUTH_DEV_BYPASS_ROLE'
> {
  const suffix = uniqueTestSuffix();
  const userId = `${label}-${suffix}`;
  return {
    AUTH_DEV_BYPASS_USER_ID: userId,
    AUTH_DEV_BYPASS_EMAIL: `${userId}@test.example.com`,
    AUTH_DEV_BYPASS_ROLE: role,
  };
}

/**
 * Build the Fastify app for tests without calling listen().
 * Clears env cache and applies overrides so each test can control AUTH_MODE etc.
 * Returns { app, restoreEnv }. Call restoreEnv() in afterEach so later tests
 * do not inherit stale auth settings.
 */
export async function buildAppForTest(envOverrides?: TestEnvOverrides): Promise<BuildAppResult> {
  clearEnvCache();

  const saved: Record<string, string | undefined> = {};
  if (envOverrides) {
    for (const [key, value] of Object.entries(envOverrides)) {
      if (value !== undefined) {
        saved[key] = process.env[key];
        process.env[key] = value;
      }
    }
  }

  const restoreEnv = (): void => {
    for (const [key, prior] of Object.entries(saved)) {
      if (prior === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prior;
      }
    }
    clearEnvCache();
  };

  const app = await buildApp();
  return { app, restoreEnv };
}
