const BLOCKED_DATABASE_HOST_PATTERNS = [
  /\.rds\.amazonaws\.com$/i,
  /\.neon\.tech$/i,
  /\.supabase\.co$/i,
  /amazonaws\.com/i,
] as const;

const BLOCKED_DATABASE_PATH_PATTERNS = [/prod/i, /production/i, /staging/i] as const;

const ALLOWED_LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', 'postgres', 'host.docker.internal']);

export type ScenarioSafetyInput = {
  nodeEnv?: string;
  databaseUrl?: string;
  /** Explicit opt-in for non-local URLs in development (e.g. disposable Neon branch). */
  allowRemote?: boolean;
};

export function parseDatabaseHost(databaseUrl: string): string | null {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
}

export function assertWorkspaceScenarioEnvironmentSafe(input: ScenarioSafetyInput = {}): void {
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    throw new Error('Workspace scenarios are blocked when NODE_ENV=production.');
  }

  const databaseUrl = input.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run workspace scenarios.');
  }

  if (process.env.FEFEAVE_WORKSPACE_SCENARIO_DISABLED === '1') {
    throw new Error('Workspace scenarios are disabled (FEFEAVE_WORKSPACE_SCENARIO_DISABLED=1).');
  }

  const host = parseDatabaseHost(databaseUrl);
  if (!host) {
    throw new Error('DATABASE_URL must be a valid URL.');
  }

  const allowRemote = input.allowRemote ?? process.env.FEFEAVE_ALLOW_WORKSPACE_SCENARIO === '1';

  if (!allowRemote && !ALLOWED_LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Workspace scenarios are limited to local databases (host=${host}). ` +
        'Set FEFEAVE_ALLOW_WORKSPACE_SCENARIO=1 only for disposable remote dev branches.'
    );
  }

  for (const pattern of BLOCKED_DATABASE_HOST_PATTERNS) {
    if (pattern.test(host)) {
      throw new Error(`Workspace scenarios are blocked for host pattern: ${host}`);
    }
  }

  for (const pattern of BLOCKED_DATABASE_PATH_PATTERNS) {
    if (pattern.test(databaseUrl)) {
      throw new Error('Workspace scenarios are blocked when DATABASE_URL looks like prod/staging.');
    }
  }
}
