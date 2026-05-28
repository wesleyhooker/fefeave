import { __testUtils, clearRuntimeSecretCache } from '../secrets/runtime-secret';

describe('backend runtime secret loading', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearRuntimeSecretCache();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('loads DATABASE_URL from Secrets Manager using ARN', async () => {
    __testUtils.setSecretsClient({
      send: jest.fn().mockResolvedValue({ SecretString: 'postgres://sm/value' }),
    });
    process.env.DATABASE_URL_SECRET_ARN = 'arn:aws:secretsmanager:us-west-2:123:secret:db';
    delete process.env.DATABASE_URL;

    const value = await __testUtils.resolveRuntimeSecret({
      key: 'DATABASE_URL',
      envKey: 'DATABASE_URL',
      arnEnvKey: 'DATABASE_URL_SECRET_ARN',
      nameEnvKey: 'DATABASE_URL_SECRET_NAME',
      required: true,
    });
    expect(value).toBe('postgres://sm/value');
    expect(process.env.DATABASE_URL).toBe('postgres://sm/value');
  });

  test('reuses cached value without repeated SM calls', async () => {
    const send = jest.fn().mockResolvedValue({ SecretString: 'postgres://cached/value' });
    __testUtils.setSecretsClient({ send });
    process.env.DATABASE_URL_SECRET_NAME = 'fefeave-backend-prod-neon-database-url';

    const first = await __testUtils.resolveRuntimeSecret({
      key: 'DATABASE_URL',
      envKey: 'DATABASE_URL',
      arnEnvKey: 'DATABASE_URL_SECRET_ARN',
      nameEnvKey: 'DATABASE_URL_SECRET_NAME',
      required: true,
    });
    const second = await __testUtils.resolveRuntimeSecret({
      key: 'DATABASE_URL',
      envKey: 'DATABASE_URL',
      arnEnvKey: 'DATABASE_URL_SECRET_ARN',
      nameEnvKey: 'DATABASE_URL_SECRET_NAME',
      required: true,
    });

    expect(first).toBe('postgres://cached/value');
    expect(second).toBe('postgres://cached/value');
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('falls back to plaintext env when no secret ref is configured', async () => {
    __testUtils.setSecretsClient({
      send: jest.fn(),
    });
    process.env.DATABASE_URL = 'postgres://env/value';
    delete process.env.DATABASE_URL_SECRET_ARN;
    delete process.env.DATABASE_URL_SECRET_NAME;

    const value = await __testUtils.resolveRuntimeSecret({
      key: 'DATABASE_URL',
      envKey: 'DATABASE_URL',
      arnEnvKey: 'DATABASE_URL_SECRET_ARN',
      nameEnvKey: 'DATABASE_URL_SECRET_NAME',
      required: true,
    });
    expect(value).toBe('postgres://env/value');
  });

  test('throws when required secret is missing from both SM and env', async () => {
    __testUtils.setSecretsClient({
      send: jest.fn().mockRejectedValue(new Error('boom')),
    });
    process.env.DATABASE_URL_SECRET_ARN = 'arn:aws:secretsmanager:us-west-2:123:secret:db';
    delete process.env.DATABASE_URL;

    await expect(
      __testUtils.resolveRuntimeSecret({
        key: 'DATABASE_URL',
        envKey: 'DATABASE_URL',
        arnEnvKey: 'DATABASE_URL_SECRET_ARN',
        nameEnvKey: 'DATABASE_URL_SECRET_NAME',
        required: true,
      })
    ).rejects.toThrow('DATABASE_URL_missing');
  });

  test('rejects malformed secret values returned from SM', async () => {
    __testUtils.setSecretsClient({
      send: jest.fn().mockResolvedValue({ SecretString: '   ' }),
    });
    process.env.DATABASE_URL_SECRET_NAME = 'fefeave-backend-prod-neon-database-url';
    delete process.env.DATABASE_URL;

    await expect(
      __testUtils.resolveRuntimeSecret({
        key: 'DATABASE_URL',
        envKey: 'DATABASE_URL',
        arnEnvKey: 'DATABASE_URL_SECRET_ARN',
        nameEnvKey: 'DATABASE_URL_SECRET_NAME',
        required: true,
      })
    ).rejects.toThrow('DATABASE_URL_missing');
  });

  test('uses env fallback when AWS SDK fetch fails', async () => {
    __testUtils.setSecretsClient({
      send: jest.fn().mockRejectedValue(new Error('throttled')),
    });
    process.env.DATABASE_URL_SECRET_ARN = 'arn:aws:secretsmanager:us-west-2:123:secret:db';
    process.env.DATABASE_URL = 'postgres://env/fallback';

    const value = await __testUtils.resolveRuntimeSecret({
      key: 'DATABASE_URL',
      envKey: 'DATABASE_URL',
      arnEnvKey: 'DATABASE_URL_SECRET_ARN',
      nameEnvKey: 'DATABASE_URL_SECRET_NAME',
      required: true,
    });
    expect(value).toBe('postgres://env/fallback');
  });
});
