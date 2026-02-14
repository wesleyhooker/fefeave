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
}>;

/**
 * Build the Fastify app for tests without calling listen().
 * Clears env cache and applies overrides so each test can control AUTH_MODE etc.
 */
export async function buildAppForTest(envOverrides?: TestEnvOverrides): Promise<FastifyInstance> {
  clearEnvCache();
  if (envOverrides) {
    for (const [key, value] of Object.entries(envOverrides)) {
      if (value !== undefined) process.env[key] = value;
    }
  }
  return buildApp();
}
