/**
 * Phase 3 — backfill historical financial domain rows into financial_events.
 *
 * Usage:
 *   DATABASE_URL=... npm run backfill:financial-events
 *   DATABASE_URL=... npm run backfill:financial-events -- --dry-run
 */
import { getPool } from '../src/db';
import { runFinancialEventsBackfill } from '../src/services/financial-events-backfill';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const pool = getPool();
  const report = await runFinancialEventsBackfill(pool, { dryRun });

  console.log(`Financial events backfill ${report.dryRun ? '(dry run)' : 'complete'}`);
  console.log(`Started:  ${report.startedAt}`);
  console.log(`Finished: ${report.finishedAt}`);
  console.log(
    `Inserted: ${report.totalInserted}  Skipped: ${report.totalSkipped}  Errors: ${report.totalErrors}`
  );
  console.log('');
  for (const table of report.tables) {
    console.log(
      `  ${table.table}: scanned=${table.scanned} inserted=${table.inserted} skipped=${table.skipped} errors=${table.errors}`
    );
    for (const err of table.errorDetails) {
      console.error(
        `    ERROR ${err.table} source=${err.sourceId} event=${err.eventType}: ${err.message}`
      );
    }
  }

  if (report.totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
