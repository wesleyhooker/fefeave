import { Pool, PoolClient, type PoolConfig } from 'pg';
import { getDatabaseUrl } from '../config/env';

let pool: Pool | null = null;

/**
 * True only inside an AWS Lambda execution environment.
 * Not set for local dev, Jest, ECS, or bare Node (`npm run dev` / `npm start`).
 */
export function isLambdaRuntime(): boolean {
  const name = process.env.AWS_LAMBDA_FUNCTION_NAME;
  return typeof name === 'string' && name.length > 0;
}

/**
 * Pool options for the current runtime. Exported for unit tests only.
 * Non-Lambda: pg defaults (e.g. max 10) — unchanged from pre-Lambda behavior.
 * Lambda: single connection per warm container (pair with Neon pooler in DATABASE_URL).
 */
export function buildPgPoolConfig(connectionString: string): PoolConfig {
  if (!isLambdaRuntime()) {
    return { connectionString };
  }
  return {
    connectionString,
    max: 1,
    idleTimeoutMillis: 20_000,
  };
}

/**
 * Get the singleton connection pool. Throws if DATABASE_URL (or split DB vars) is not configured.
 */
export function getPool(): Pool {
  if (!pool) {
    const url = getDatabaseUrl();
    if (!url) {
      throw new Error(
        'Database not configured. Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD'
      );
    }
    pool = new Pool(buildPgPoolConfig(url));
  }
  return pool;
}

/**
 * Close and reset the singleton pool. Safe to call multiple times.
 */
export async function closePool(): Promise<void> {
  const current = pool;
  pool = null;
  await current?.end();
}

/**
 * Execute a function within a database transaction. Automatically commits on success, rolls back on error.
 */
export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
