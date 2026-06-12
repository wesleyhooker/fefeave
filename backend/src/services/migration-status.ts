import fs from 'node:fs';
import path from 'node:path';
import type { Queryable } from './financial-events';

export type MigrationCheckStatus = 'ok' | 'error' | 'skipped';

export type MigrationStatusResult = {
  status: MigrationCheckStatus;
  expected_count: number;
  applied_count: number;
  pending: string[];
  unknown_applied: string[];
  message?: string;
};

function migrationSortKey(name: string): number | string {
  const prefix = name.split('_')[0];
  const numeric = Number(prefix);
  return Number.isFinite(numeric) ? numeric : prefix;
}

function sortMigrationNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ka = migrationSortKey(a);
    const kb = migrationSortKey(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.localeCompare(b);
  });
}

function readManifestMigrations(): string[] | null {
  const candidates = [
    path.join(__dirname, '../migrations-manifest.json'),
    path.join(process.cwd(), 'dist/migrations-manifest.json'),
  ];
  for (const manifestPath of candidates) {
    if (!fs.existsSync(manifestPath)) continue;
    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { migrations?: string[] };
    if (Array.isArray(raw.migrations) && raw.migrations.length > 0) {
      return sortMigrationNames(raw.migrations);
    }
  }
  return null;
}

function readDirectoryMigrations(): string[] {
  const candidates = [
    path.join(__dirname, '../../migrations'),
    path.join(process.cwd(), 'migrations'),
  ];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const names = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => file.replace(/\.js$/, ''));
    if (names.length > 0) return sortMigrationNames(names);
  }
  return [];
}

/** Expected migration names from migrations/ or build-time manifest. */
export function listExpectedMigrationNames(): string[] {
  return readManifestMigrations() ?? readDirectoryMigrations();
}

async function listAppliedMigrationNames(db: Queryable): Promise<string[]> {
  const result = await db.query(
    `SELECT name
     FROM pgmigrations
     ORDER BY run_on ASC, name ASC`
  );
  return (result.rows as Array<{ name: string }>).map((row) => row.name);
}

/** Compare on-disk (or manifest) migrations with pgmigrations table. */
export async function checkMigrationStatus(db: Queryable): Promise<MigrationStatusResult> {
  const expected = listExpectedMigrationNames();
  if (expected.length === 0) {
    return {
      status: 'error',
      expected_count: 0,
      applied_count: 0,
      pending: [],
      unknown_applied: [],
      message: 'No migration manifest or migrations directory found',
    };
  }

  let applied: string[];
  try {
    applied = await listAppliedMigrationNames(db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('pgmigrations') && message.includes('does not exist')) {
      return {
        status: 'error',
        expected_count: expected.length,
        applied_count: 0,
        pending: expected,
        unknown_applied: [],
        message: 'pgmigrations table missing — run npm run migrate:up',
      };
    }
    throw err;
  }

  const expectedSet = new Set(expected);
  const appliedSet = new Set(applied);
  const pending = expected.filter((name) => !appliedSet.has(name));
  const unknownApplied = applied.filter((name) => !expectedSet.has(name));

  if (pending.length > 0 || unknownApplied.length > 0) {
    const parts: string[] = [];
    if (pending.length > 0) parts.push(`${pending.length} pending migration(s)`);
    if (unknownApplied.length > 0)
      parts.push(`${unknownApplied.length} unknown applied migration(s)`);
    return {
      status: 'error',
      expected_count: expected.length,
      applied_count: applied.length,
      pending,
      unknown_applied: unknownApplied,
      message: parts.join('; '),
    };
  }

  return {
    status: 'ok',
    expected_count: expected.length,
    applied_count: applied.length,
    pending: [],
    unknown_applied: [],
  };
}
