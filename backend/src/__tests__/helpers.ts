import { FastifyInstance } from 'fastify';
import { buildApp } from '../index';
import { clearEnvCache } from '../config/env';

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
}>;

export type BuildAppResult = {
  app: FastifyInstance;
  restoreEnv: () => void;
};

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
