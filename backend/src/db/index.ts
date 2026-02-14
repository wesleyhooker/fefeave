import { Pool, PoolClient } from 'pg';
import { getDatabaseUrl } from '../config/env';

let pool: Pool | null = null;

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
    pool = new Pool({ connectionString: url });
  }
  return pool;
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
