import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../utils/logger';

type SecretSpec = {
  key: string;
  envKey: string;
  arnEnvKey: string;
  nameEnvKey: string;
  required: boolean;
};

let smClient: {
  send(command: GetSecretValueCommand): Promise<{ SecretString?: string }>;
} = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? process.env.COGNITO_REGION ?? 'us-west-2',
});

const cache = new Map<string, string>();
const cacheHitLogged = new Set<string>();

async function fetchSecretFromSm(secretId: string): Promise<string> {
  const res = await smClient.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );
  const value = res.SecretString?.trim();
  if (!value) {
    throw new Error('empty_secret_string');
  }
  return value;
}

async function resolveRuntimeSecret(spec: SecretSpec): Promise<string | null> {
  if (cache.has(spec.key)) {
    if (!cacheHitLogged.has(spec.key)) {
      cacheHitLogged.add(spec.key);
      logger.info({ secretKey: spec.key, source: 'memory_cache' }, 'Runtime secret cache hit');
    }
    return cache.get(spec.key) ?? null;
  }

  const envValue = process.env[spec.envKey]?.trim();
  const secretRef = process.env[spec.arnEnvKey]?.trim() || process.env[spec.nameEnvKey]?.trim();

  if (secretRef) {
    try {
      const value = await fetchSecretFromSm(secretRef);
      cache.set(spec.key, value);
      process.env[spec.envKey] = value;
      logger.info(
        {
          secretKey: spec.key,
          source: 'secrets_manager',
          secretRefKind: process.env[spec.arnEnvKey] ? 'arn' : 'name',
        },
        'Runtime secret loaded from Secrets Manager'
      );
      return value;
    } catch (error) {
      logger.warn(
        {
          secretKey: spec.key,
          source: 'secrets_manager',
          fallback: envValue ? 'env' : 'none',
          reason: error instanceof Error ? error.message : 'unknown_error',
        },
        'Runtime secret fetch failed'
      );
    }
  }

  if (envValue) {
    cache.set(spec.key, envValue);
    logger.info({ secretKey: spec.key, source: 'env' }, 'Runtime secret using env fallback');
    return envValue;
  }

  if (spec.required) {
    throw new Error(`${spec.key}_missing`);
  }
  return null;
}

export async function hydrateBackendRuntimeSecrets(): Promise<void> {
  const hasDirectEnv = !!process.env.DATABASE_URL?.trim();
  const hasSecretRef =
    !!process.env.DATABASE_URL_SECRET_ARN?.trim() || !!process.env.DATABASE_URL_SECRET_NAME?.trim();

  if (!hasDirectEnv && !hasSecretRef) {
    logger.info(
      { secretKey: 'DATABASE_URL', source: 'none' },
      'Runtime secret hydration skipped (no env value or secret reference)'
    );
    return;
  }

  await resolveRuntimeSecret({
    key: 'DATABASE_URL',
    envKey: 'DATABASE_URL',
    arnEnvKey: 'DATABASE_URL_SECRET_ARN',
    nameEnvKey: 'DATABASE_URL_SECRET_NAME',
    required: false,
  });
}

export function clearRuntimeSecretCache(): void {
  cache.clear();
  cacheHitLogged.clear();
}

export const __testUtils = {
  resolveRuntimeSecret,
  setSecretsClient(client: {
    send(command: GetSecretValueCommand): Promise<{ SecretString?: string }>;
  }) {
    smClient = client;
  },
};
