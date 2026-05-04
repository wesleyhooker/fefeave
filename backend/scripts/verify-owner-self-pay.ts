/**
 * Programmatic verification of owner self-pay upsert + void behavior.
 * Mirrors SQL in `src/routes/owner-self-pay.ts` (no HTTP, no UI).
 *
 * Uses only rows for a fixed synthetic week; cleans that week before/after logic.
 */

import { loadEnv } from '../src/config/env';
import { closePool, getPool, withTx } from '../src/db';
import { computeOwnerWeeklyPayout } from '../src/services/owner-weekly-payout';

/** Monday YYYY-MM-DD — must stay fixed so reruns only touch this week. */
const ZERO_WEEK_START = '2018-06-04';

function addDays(yyyyMmDd: string, days: number): string {
  const year = Number(yyyyMmDd.slice(0, 4));
  const month = Number(yyyyMmDd.slice(5, 7));
  const day = Number(yyyyMmDd.slice(8, 10));
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const ZERO_WEEK_END = addDays(ZERO_WEEK_START, 6);

async function resolveOwnerAccountId(): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM accounts
     WHERE type = 'OWNER'::account_type
       AND deleted_at IS NULL
     ORDER BY created_at ASC, id ASC
     LIMIT 1`
  );
  if (result.rows.length === 0) {
    throw new Error('No OWNER account found (run migrations / seed).');
  }
  return (result.rows[0] as { id: string }).id;
}

async function markPaidRouteLogic(args: {
  ownerAccountId: string;
  weekStart: string;
  weekEnd: string;
  claimedAmount?: number;
}): Promise<{ id: string }> {
  const pool = getPool();
  const computed = await computeOwnerWeeklyPayout(pool, args.weekStart, args.weekEnd);
  if (computed.amount <= 0) {
    throw new Error(
      `No owner payout available for ${args.weekStart} to ${args.weekEnd}; payout must be greater than 0`
    );
  }
  if (args.claimedAmount !== undefined && Math.abs(args.claimedAmount - computed.amount) > 0.01) {
    throw new Error(
      `Claimed amount ${args.claimedAmount.toFixed(
        2
      )} does not match computed payout ${computed.amount.toFixed(2)}`
    );
  }

  return withTx(async (client) => {
    const reference = 'Week payout';
    const note = 'Week payout';
    const result = await client.query<{ id: string }>(
      `INSERT INTO owner_self_pay_transactions (
         account_id,
         account_type,
         amount,
         week_start_date,
         week_end_date,
         paid_at,
         transaction_type,
         reference,
         note,
         created_by,
         voided_at,
         deleted_at
       )
       VALUES ($1, 'OWNER', $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6, $7, $8, NULL, NULL, NULL)
       ON CONFLICT (account_id, week_start_date)
       DO UPDATE
          SET account_type = 'OWNER',
              amount = EXCLUDED.amount,
              week_end_date = EXCLUDED.week_end_date,
              paid_at = EXCLUDED.paid_at,
              transaction_type = EXCLUDED.transaction_type,
              reference = EXCLUDED.reference,
              note = EXCLUDED.note,
              created_by = EXCLUDED.created_by,
              voided_at = NULL,
              deleted_at = NULL,
              updated_at = NOW()
       RETURNING id`,
      [
        args.ownerAccountId,
        computed.amount,
        args.weekStart,
        args.weekEnd,
        null,
        'SELF_PAY',
        reference,
        note,
      ]
    );
    const row = result.rows[0];
    if (!row) throw new Error('upsertMarkPaid: no row returned');
    return row;
  });
}

/** Same UPDATE as DELETE /owner-self-pay/:weekStart (void). */
async function voidWeek(ownerAccountId: string, weekStart: string): Promise<void> {
  await withTx(async (client) => {
    await client.query(
      `UPDATE owner_self_pay_transactions
       SET voided_at = NOW(),
           updated_at = NOW()
       WHERE account_id = $1
         AND week_start_date = $2
         AND voided_at IS NULL
         AND deleted_at IS NULL`,
      [ownerAccountId, weekStart]
    );
  });
}

async function countRowsForWeek(ownerAccountId: string, weekStart: string): Promise<number> {
  const pool = getPool();
  const r = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM owner_self_pay_transactions
     WHERE account_id = $1 AND week_start_date = $2`,
    [ownerAccountId, weekStart]
  );
  return Number.parseInt(r.rows[0]?.c ?? '0', 10);
}

async function loadRowForWeek(
  ownerAccountId: string,
  weekStart: string
): Promise<{ id: string; amount: string; voided_at: Date | null; updated_at: Date } | null> {
  const pool = getPool();
  const r = await pool.query<{
    id: string;
    amount: string;
    voided_at: Date | null;
    updated_at: Date;
  }>(
    `SELECT id, amount::text, voided_at, updated_at
     FROM owner_self_pay_transactions
     WHERE account_id = $1 AND week_start_date = $2
     LIMIT 1`,
    [ownerAccountId, weekStart]
  );
  return r.rows[0] ?? null;
}

async function cleanupTestWeek(ownerAccountId: string, weekStart: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM owner_self_pay_transactions
     WHERE account_id = $1 AND week_start_date = $2`,
    [ownerAccountId, weekStart]
  );
}

let failures = 0;

function report(step: string, ok: boolean, detail?: string): void {
  const tag = ok ? 'PASS' : 'FAIL';
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[${tag}] ${step}${suffix}`);
  if (!ok) failures += 1;
}

async function main(): Promise<void> {
  loadEnv();
  console.log('Owner self-pay verification');
  console.log(`Zero-payout week: ${ZERO_WEEK_START} … ${ZERO_WEEK_END}`);
  console.log('');

  const pool = getPool();
  const ownerAccountId = await resolveOwnerAccountId();
  console.log(`OWNER account_id: ${ownerAccountId}`);

  // Pick a completed-show week that has a positive computed owner payout.
  const completedRows = await pool.query<{ show_date: string }>(
    `SELECT DISTINCT date_trunc('week', s.show_date)::date::text AS show_date
     FROM shows s
     WHERE s.deleted_at IS NULL
       AND s.status = 'COMPLETED'
     ORDER BY show_date DESC`
  );
  let payoutWeekStart: string | null = null;
  let payoutWeekEnd: string | null = null;
  let expectedAmount = 0;
  for (const row of completedRows.rows) {
    const weekStart = row.show_date;
    const weekEnd = addDays(weekStart, 6);
    const payout = await computeOwnerWeeklyPayout(pool, weekStart, weekEnd);
    if (payout.amount > 0) {
      payoutWeekStart = weekStart;
      payoutWeekEnd = weekEnd;
      expectedAmount = payout.amount;
      break;
    }
  }
  if (!payoutWeekStart || !payoutWeekEnd) {
    throw new Error('No completed week with positive payout found. Seed closed shows first.');
  }

  console.log(
    `Positive-payout week: ${payoutWeekStart} … ${payoutWeekEnd} (expected ${expectedAmount.toFixed(2)})`
  );
  await cleanupTestWeek(ownerAccountId, payoutWeekStart);
  await cleanupTestWeek(ownerAccountId, ZERO_WEEK_START);

  let lastId: string | null = null;
  let firstVoidedAtIso: string | null = null;
  let firstVoidUpdatedAtIso: string | null = null;

  // A. Mark paid
  {
    const step = 'A. Mark paid (first time) stores computed expected amount';
    await markPaidRouteLogic({
      ownerAccountId,
      weekStart: payoutWeekStart,
      weekEnd: payoutWeekEnd,
      claimedAmount: expectedAmount,
    });
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    lastId = row?.id ?? null;
    const amountMatches = row != null && Math.abs(Number(row.amount) - expectedAmount) <= 0.01;
    report(
      step,
      c === 1 && row != null && row.voided_at == null && amountMatches,
      `count=${c}, amount=${row?.amount ?? 'n/a'}, expected=${expectedAmount.toFixed(2)}`
    );
  }

  // B. Mark paid again
  {
    const step = 'B. Mark paid again (idempotent upsert)';
    const beforeId = lastId;
    const { id } = await markPaidRouteLogic({
      ownerAccountId,
      weekStart: payoutWeekStart,
      weekEnd: payoutWeekEnd,
      claimedAmount: expectedAmount,
    });
    lastId = id;
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    const sameRow = beforeId != null && id === beforeId;
    const amountMatches = row != null && Math.abs(Number(row.amount) - expectedAmount) <= 0.01;
    report(
      step,
      c === 1 && row != null && row.voided_at == null && sameRow && amountMatches,
      `count=${c}, same id=${sameRow}, amount=${row?.amount ?? 'n/a'}`
    );
  }

  // C. Mark unpaid (void)
  {
    const step = 'C. Mark unpaid (void)';
    await voidWeek(ownerAccountId, payoutWeekStart);
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    firstVoidedAtIso = row?.voided_at ? new Date(row.voided_at).toISOString() : null;
    firstVoidUpdatedAtIso = row?.updated_at ? new Date(row.updated_at).toISOString() : null;
    report(
      step,
      c === 1 && row != null && row.voided_at != null,
      `count=${c}, voided_at set=${row?.voided_at != null}`
    );
  }

  // D. Mark unpaid again (idempotent no-op)
  {
    const step = 'D. Mark unpaid twice does not change/create extra rows';
    await voidWeek(ownerAccountId, payoutWeekStart);
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    const voidedUnchanged =
      (row?.voided_at ? new Date(row.voided_at).toISOString() : null) === firstVoidedAtIso;
    const updatedUnchanged =
      (row?.updated_at ? new Date(row.updated_at).toISOString() : null) === firstVoidUpdatedAtIso;
    report(
      step,
      c === 1 && row != null && row.voided_at != null && voidedUnchanged && updatedUnchanged,
      `count=${c}, voided unchanged=${voidedUnchanged}, updated unchanged=${updatedUnchanged}`
    );
  }

  // E. Mark paid again (revive)
  {
    const step = 'E. Mark paid after void revives same row';
    const beforeId = lastId;
    const { id } = await markPaidRouteLogic({
      ownerAccountId,
      weekStart: payoutWeekStart,
      weekEnd: payoutWeekEnd,
      claimedAmount: expectedAmount,
    });
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    const sameRow = beforeId != null && id === beforeId;
    const amountMatches = row != null && Math.abs(Number(row.amount) - expectedAmount) <= 0.01;
    report(
      step,
      c === 1 && row != null && row.voided_at == null && sameRow && amountMatches,
      `count=${c}, voided_at cleared=${row?.voided_at == null}, same id=${sameRow}`
    );
  }

  // F. $0 payout week should be rejected (no active row created)
  {
    const step = 'F. $0 payout week is rejected (no-op, no row)';
    let rejected = false;
    try {
      await markPaidRouteLogic({
        ownerAccountId,
        weekStart: ZERO_WEEK_START,
        weekEnd: ZERO_WEEK_END,
        claimedAmount: 0,
      });
    } catch {
      rejected = true;
    }
    const c = await countRowsForWeek(ownerAccountId, ZERO_WEEK_START);
    report(step, rejected && c === 0, `rejected=${rejected}, count=${c}`);
  }

  // G. Mismatched claimed amount should be rejected
  {
    const step = 'G. mismatched client amount is rejected';
    let rejected = false;
    try {
      await markPaidRouteLogic({
        ownerAccountId,
        weekStart: payoutWeekStart,
        weekEnd: payoutWeekEnd,
        claimedAmount: expectedAmount + 12.34,
      });
    } catch {
      rejected = true;
    }
    report(step, rejected, `rejected=${rejected}`);
  }

  // H. Sanity: still one active row after mismatch rejection
  {
    const step = 'H. mismatch rejection leaves one active row';
    const c = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const row = await loadRowForWeek(ownerAccountId, payoutWeekStart);
    report(step, c === 1 && row != null && row.voided_at == null, `count=${c}`);
  }

  // I. cleanup verification row
  {
    const step = 'I. cleanup removes verification rows';
    await cleanupTestWeek(ownerAccountId, payoutWeekStart);
    await cleanupTestWeek(ownerAccountId, ZERO_WEEK_START);
    const c1 = await countRowsForWeek(ownerAccountId, payoutWeekStart);
    const c2 = await countRowsForWeek(ownerAccountId, ZERO_WEEK_START);
    report(step, c1 === 0 && c2 === 0, `positiveWeek=${c1}, zeroWeek=${c2}`);
  }

  console.log('');
  if (failures === 0) {
    console.log('SUMMARY: all steps PASS');
    process.exitCode = 0;
  } else {
    console.log(`SUMMARY: ${failures} step(s) FAILED`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('verify-owner-self-pay aborted:', e);
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
