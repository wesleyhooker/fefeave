import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

type SecretOptions = {
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

function logSafe(
  level: 'info' | 'warn',
  message: string,
  data: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === 'test') return;
  const payload = { component: 'runtime-secrets', ...data };
  if (level === 'warn') {
    console.warn(message, payload);
    return;
  }
  console.info(message, payload);
}

async function fetchSecret(secretId: string): Promise<string> {
  const response = await smClient.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );
  const value = response.SecretString?.trim();
  if (!value) {
    throw new Error('empty_secret_string');
  }
  return value;
}

export async function resolveRuntimeSecret(
  options: SecretOptions,
): Promise<string> {
  if (cache.has(options.key)) {
    if (!cacheHitLogged.has(options.key)) {
      cacheHitLogged.add(options.key);
      logSafe('info', 'Runtime secret cache hit', {
        secretKey: options.key,
        source: 'memory_cache',
      });
    }
    return cache.get(options.key)!;
  }

  const envValue = process.env[options.envKey]?.trim();
  const arnRef = process.env[options.arnEnvKey]?.trim();
  const nameRef = process.env[options.nameEnvKey]?.trim();
  const secretRef = arnRef || nameRef;

  if (secretRef) {
    try {
      const value = await fetchSecret(secretRef);
      cache.set(options.key, value);
      process.env[options.envKey] = value;
      logSafe('info', 'Runtime secret loaded from Secrets Manager', {
        secretKey: options.key,
        source: 'secrets_manager',
        secretRefKind: arnRef ? 'arn' : 'name',
      });
      return value;
    } catch (error) {
      logSafe('warn', 'Runtime secret fetch failed', {
        secretKey: options.key,
        source: 'secrets_manager',
        fallback: envValue ? 'env' : 'none',
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  if (envValue) {
    cache.set(options.key, envValue);
    logSafe('info', 'Runtime secret using env fallback', {
      secretKey: options.key,
      source: 'env',
    });
    return envValue;
  }

  if (options.required) {
    throw new Error(`${options.key}_missing`);
  }
  return '';
}

export async function hydrateFrontendRuntimeSecrets(): Promise<void> {
  await Promise.all([
    resolveRuntimeSecret({
      key: 'AUTH_SESSION_SECRET',
      envKey: 'AUTH_SESSION_SECRET',
      arnEnvKey: 'AUTH_SESSION_SECRET_ARN',
      nameEnvKey: 'AUTH_SESSION_SECRET_NAME',
      required: true,
    }),
    resolveRuntimeSecret({
      key: 'COGNITO_CLIENT_SECRET',
      envKey: 'COGNITO_CLIENT_SECRET',
      arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
      nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
      required: true,
    }),
  ]);
}

export async function getAuthSessionSecret(): Promise<string> {
  return resolveRuntimeSecret({
    key: 'AUTH_SESSION_SECRET',
    envKey: 'AUTH_SESSION_SECRET',
    arnEnvKey: 'AUTH_SESSION_SECRET_ARN',
    nameEnvKey: 'AUTH_SESSION_SECRET_NAME',
    required: true,
  });
}

export async function getCognitoClientSecret(): Promise<string> {
  return resolveRuntimeSecret({
    key: 'COGNITO_CLIENT_SECRET',
    envKey: 'COGNITO_CLIENT_SECRET',
    arnEnvKey: 'COGNITO_CLIENT_SECRET_ARN',
    nameEnvKey: 'COGNITO_CLIENT_SECRET_NAME',
    required: true,
  });
}

export function clearRuntimeSecretCache(): void {
  cache.clear();
  cacheHitLogged.clear();
}

export const __testUtils = {
  setSecretsClient(client: {
    send(command: GetSecretValueCommand): Promise<{ SecretString?: string }>;
  }) {
    smClient = client;
  },
};
