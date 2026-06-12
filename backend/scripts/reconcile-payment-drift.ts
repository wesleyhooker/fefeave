/**
 * Gate 0 — reconcile historical vendor payment drift.
 *
 * Usage:
 *   DATABASE_URL=... npm run reconcile:payment-drift -- --report
 *   DATABASE_URL=... npm run reconcile:payment-drift -- --dry-run
 *   DATABASE_URL=... npm run reconcile:payment-drift -- --reconcile
 *
 * Default: --report (read-only audit).
 */
import { getPool } from '../src/db';
import {
  auditPaymentDrift,
  reconcilePaymentDrift,
  type PaymentDriftReconcileReport,
} from '../src/services/payment-drift';

function parseMode(): 'report' | 'dry-run' | 'reconcile' {
  const args = process.argv.slice(2);
  if (args.includes('--reconcile')) return 'reconcile';
  if (args.includes('--dry-run')) return 'dry-run';
  return 'report';
}

function printReport(report: PaymentDriftReconcileReport): void {
  const label =
    report.mode === 'report'
      ? 'Payment drift report'
      : report.dry_run
        ? 'Payment drift dry-run'
        : 'Payment drift reconciliation';

  console.log(`${label} ${report.dry_run && report.mode !== 'report' ? '(no writes)' : ''}`);
  console.log(`Started:  ${report.started_at}`);
  console.log(`Finished: ${report.finished_at}`);
  console.log('');
  console.log('Summary:');
  console.log(`  Drift rows:              ${report.summary.total_drift_rows}`);
  console.log(`  active_missing_event:    ${report.summary.active_missing_event}`);
  console.log(`  active_value_drift:      ${report.summary.active_value_drift}`);
  console.log(`  active_latest_voided:    ${report.summary.active_latest_voided}`);
  console.log(`  deleted_not_voided:      ${report.summary.deleted_not_voided}`);
  console.log(`  Table paid grand total:  ${report.summary.table_paid_grand_total}`);
  console.log(`  Event paid grand total:  ${report.summary.event_paid_grand_total}`);
  console.log(`  Table/event delta:       ${report.summary.table_event_paid_delta}`);
  console.log(`  Wholesaler mismatches:   ${report.summary.wholesaler_mismatches.length}`);

  if (report.summary.wholesaler_mismatches.length > 0) {
    console.log('');
    console.log('Wholesaler paid total mismatches:');
    for (const row of report.summary.wholesaler_mismatches) {
      console.log(
        `  ${row.wholesaler_id}  table=${row.table_paid_total}  event=${row.event_paid_total}  delta=${row.delta}`
      );
    }
  }

  if (report.drift_rows.length > 0) {
    console.log('');
    console.log('Drift rows:');
    for (const row of report.drift_rows) {
      console.log(
        `  ${row.payment_id}  kind=${row.kind}  table=${row.table_amount}@${row.table_payment_date}  latest=${row.latest_event_type ?? 'none'}@${row.latest_event_amount ?? '-'}`
      );
    }
  }

  if (report.results.length > 0) {
    console.log('');
    console.log(
      `Actions: emitted=${report.emitted}  skipped=${report.skipped}  manual_review=${report.manual_review}  errors=${report.errors}`
    );
    for (const result of report.results) {
      const msg = result.message ? ` (${result.message})` : '';
      console.log(`  ${result.payment_id}  ${result.action}  ${result.event_type ?? '-'}${msg}`);
    }
  }

  for (const err of report.error_details) {
    console.error(`  ERROR ${err.payment_id}: ${err.message}`);
  }
}

async function main(): Promise<void> {
  const mode = parseMode();
  const pool = getPool();

  const report =
    mode === 'report'
      ? await auditPaymentDrift(pool).then((audit) => ({
          ...audit,
          dry_run: true,
          drift_rows: audit.rows,
          results: [],
          emitted: 0,
          skipped: 0,
          manual_review: audit.summary.active_latest_voided,
          errors: 0,
          error_details: [],
        }))
      : await reconcilePaymentDrift(pool, { mode });

  printReport(report);

  if (report.errors > 0 || report.summary.active_latest_voided > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Payment drift reconciliation failed:', err);
  process.exit(1);
});
