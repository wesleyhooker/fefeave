import assert from 'node:assert/strict';
import { describe, it, beforeEach, after } from 'node:test';
import {
  __testUtils,
  clearRuntimeSecretCache,
  resolveRuntimeSecret,
} from './runtime-secrets.server.ts';

describe('frontend runtime secret loading', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    clearRuntimeSecretCache();
  });

  after(() => {
    process.env = originalEnv;
  });

  it('loads secret from SM via ARN', async () => {
    __testUtils.setSecretsClient({
      send: async () => ({ SecretString: 'sm-secret' }),
    });
    process.env.AUTH_SESSION_SECRET_ARN =
      'arn:aws:secretsmanager:us-west-2:123:secret:auth';
    delete process.env.AUTH_SESSION_SECRET;

    const value = await resolveRuntimeSecret({
      key: 'AUTH_SESSION_SECRET',
      envKey: 'AUTH_SESSION_SECRET',
      arnEnvKey: 'AUTH_SESSION_SECRET_ARN',
      nameEnvKey: 'AUTH_SESSION_SECRET_NAME',
      required: true,
    });
    assert.equal(value, 'sm-secret');
    assert.equal(process.env.AUTH_SESSION_SECRET, 'sm-secret');
  });

  it('reuses in-memory cache on second call', async () => {
    let calls = 0;
    __testUtils.setSecretsClient({
      send: async () => {
        calls += 1;
        return { SecretString: 'cached-secret' };
      },
    });
    process.env.COGNITO_CLIENT_SECRET_NAME = 'frontend-cognito-secret';

    const a = await resolveRuntimeSecret({
      key: 'COGNITO_CLIENT_SECRET',
      envKey: 'COGNITO_CLIENT_SECRET',
      arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
      nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
      required: true,
    });
    const b = await resolveRuntimeSecret({
      key: 'COGNITO_CLIENT_SECRET',
      envKey: 'COGNITO_CLIENT_SECRET',
      arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
      nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
      required: true,
    });
    assert.equal(a, 'cached-secret');
    assert.equal(b, 'cached-secret');
    assert.equal(calls, 1);
  });

  it('falls back to plaintext env when no secret ref exists', async () => {
    __testUtils.setSecretsClient({
      send: async () => ({ SecretString: 'unused' }),
    });
    process.env.COGNITO_CLIENT_SECRET = 'env-secret';
    delete process.env.COGNITO_CLIENT_SECRET_ARN;
    delete process.env.COGNITO_CLIENT_SECRET_NAME;

    const value = await resolveRuntimeSecret({
      key: 'COGNITO_CLIENT_SECRET',
      envKey: 'COGNITO_CLIENT_SECRET',
      arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
      nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
      required: true,
    });
    assert.equal(value, 'env-secret');
  });

  it('throws when missing required secret from both SM and env', async () => {
    __testUtils.setSecretsClient({
      send: async () => {
        throw new Error('boom');
      },
    });
    process.env.COGNITO_CLIENT_SECRET_ARN =
      'arn:aws:secretsmanager:us-west-2:123:secret:cognito';
    delete process.env.COGNITO_CLIENT_SECRET;

    await assert.rejects(
      () =>
        resolveRuntimeSecret({
          key: 'COGNITO_CLIENT_SECRET',
          envKey: 'COGNITO_CLIENT_SECRET',
          arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
          nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
          required: true,
        }),
      /COGNITO_CLIENT_SECRET_missing/,
    );
  });

  it('treats whitespace SM value as malformed and throws when no fallback env', async () => {
    __testUtils.setSecretsClient({
      send: async () => ({ SecretString: '   ' }),
    });
    process.env.AUTH_SESSION_SECRET_NAME = 'frontend-auth-secret';
    delete process.env.AUTH_SESSION_SECRET;

    await assert.rejects(
      () =>
        resolveRuntimeSecret({
          key: 'AUTH_SESSION_SECRET',
          envKey: 'AUTH_SESSION_SECRET',
          arnEnvKey: 'AUTH_SESSION_SECRET_ARN',
          nameEnvKey: 'AUTH_SESSION_SECRET_NAME',
          required: true,
        }),
      /AUTH_SESSION_SECRET_missing/,
    );
  });

  it('uses env fallback when AWS SDK fetch fails', async () => {
    __testUtils.setSecretsClient({
      send: async () => {
        throw new Error('throttled');
      },
    });
    process.env.AUTH_SESSION_SECRET_ARN =
      'arn:aws:secretsmanager:us-west-2:123:secret:auth';
    process.env.AUTH_SESSION_SECRET = 'env-fallback-secret';

    const value = await resolveRuntimeSecret({
      key: 'AUTH_SESSION_SECRET',
      envKey: 'AUTH_SESSION_SECRET',
      arnEnvKey: 'AUTH_SESSION_SECRET_ARN',
      nameEnvKey: 'AUTH_SESSION_SECRET_NAME',
      required: true,
    });
    assert.equal(value, 'env-fallback-secret');
  });
});
