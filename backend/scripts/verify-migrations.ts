/**
 * Verify DATABASE_URL schema matches expected migrations (exit 1 if pending).
 *
 * Usage:
 *   DATABASE_URL=... npm run verify:migrations
 */
import { loadEnv } from '../src/config/env';
import { getPool, closePool } from '../src/db';
import { checkMigrationStatus } from '../src/services/migration-status';

async function main(): Promise<void> {
  loadEnv();
  const pool = getPool();
  const result = await checkMigrationStatus(pool);

  console.log(`Migration status: ${result.status}`);
  console.log(`Expected: ${result.expected_count}  Applied: ${result.applied_count}`);

  if (result.pending.length > 0) {
    console.error('Pending migrations:');
    for (const name of result.pending) {
      console.error(`  - ${name}`);
    }
  }

  if (result.unknown_applied.length > 0) {
    console.error('Unknown applied migrations (DB ahead of code or missing files):');
    for (const name of result.unknown_applied) {
      console.error(`  - ${name}`);
    }
  }

  if (result.message) {
    console.error(result.message);
  }

  await closePool();

  if (result.status !== 'ok') {
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  console.error('Migration verification failed:', err);
  await closePool().catch(() => undefined);
  process.exit(1);
});
