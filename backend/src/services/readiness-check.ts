import { getDatabaseUrl, getEnv } from '../config/env';
import { getPool } from '../db';
import { checkMigrationStatus, type MigrationStatusResult } from './migration-status';

export type ReadinessCheckStatus = 'ok' | 'error' | 'skipped';

export type ReadinessCheckDetail = {
  status: ReadinessCheckStatus;
  latency_ms?: number;
  reason?: string;
  message?: string;
  applied?: number;
  pending?: number;
  expected?: number;
  pending_migrations?: string[];
};

export type ReadinessReport = {
  status: 'ok' | 'unhealthy';
  checks: {
    app: ReadinessCheckDetail;
    database: ReadinessCheckDetail;
    migrations: ReadinessCheckDetail;
  };
};

function skipped(reason: string): ReadinessCheckDetail {
  return { status: 'skipped', reason };
}

async function checkDatabase(): Promise<ReadinessCheckDetail> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    if (getEnv().NODE_ENV === 'production') {
      return {
        status: 'error',
        message: 'DATABASE_URL (or split DB vars) required in production',
      };
    }
    return skipped('not_configured');
  }

  const started = Date.now();
  try {
    const pool = getPool();
    await pool.query('SELECT 1 AS ok');
    return { status: 'ok', latency_ms: Date.now() - started };
  } catch (err) {
    return {
      status: 'error',
      latency_ms: Date.now() - started,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function migrationDetail(result: MigrationStatusResult): ReadinessCheckDetail {
  if (result.status === 'ok') {
    return {
      status: 'ok',
      applied: result.applied_count,
      pending: 0,
      expected: result.expected_count,
    };
  }
  return {
    status: 'error',
    applied: result.applied_count,
    pending: result.pending.length,
    expected: result.expected_count,
    pending_migrations: result.pending.slice(0, 10),
    message: result.message,
  };
}

/** Full readiness: app process up, DB reachable, migrations in sync. */
export async function runReadinessCheck(): Promise<ReadinessReport> {
  const app: ReadinessCheckDetail = { status: 'ok' };
  const database = await checkDatabase();

  let migrations: ReadinessCheckDetail;
  if (database.status === 'skipped') {
    migrations = skipped('database_not_configured');
  } else if (database.status === 'error') {
    migrations = skipped('database_unavailable');
  } else {
    try {
      const pool = getPool();
      migrations = migrationDetail(await checkMigrationStatus(pool));
    } catch (err) {
      migrations = {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const checks = { app, database, migrations };
  const unhealthy =
    database.status === 'error' ||
    migrations.status === 'error' ||
    (getEnv().NODE_ENV === 'production' && database.status === 'skipped');

  return {
    status: unhealthy ? 'unhealthy' : 'ok',
    checks,
  };
}
