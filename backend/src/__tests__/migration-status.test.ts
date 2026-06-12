import { listExpectedMigrationNames } from '../services/migration-status';
import { loadEnv, clearEnvCache } from '../config/env';

describe('migration-status', () => {
  it('listExpectedMigrationNames includes core-schema migration', () => {
    const names = listExpectedMigrationNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names.some((n) => n.includes('core-schema'))).toBe(true);
  });
});

describe('env production guard', () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
    clearEnvCache();
  });

  it('rejects AUTH_MODE=dev_bypass when NODE_ENV=production', () => {
    process.env = {
      ...savedEnv,
      NODE_ENV: 'production',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'user-1',
      AUTH_DEV_BYPASS_EMAIL: 'admin@example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    };
    clearEnvCache();
    expect(() => loadEnv()).toThrow(/dev_bypass is not allowed when NODE_ENV=production/);
  });

  it('allows AUTH_MODE=cognito when NODE_ENV=production', () => {
    process.env = {
      ...savedEnv,
      NODE_ENV: 'production',
      AUTH_MODE: 'cognito',
      COGNITO_REGION: 'us-west-2',
      COGNITO_USER_POOL_ID: 'us-west-2_abc',
      COGNITO_APP_CLIENT_ID: 'client-id',
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    };
    clearEnvCache();
    expect(loadEnv().AUTH_MODE).toBe('cognito');
  });
});
