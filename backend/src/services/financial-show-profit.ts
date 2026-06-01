/**
 * Phase 7c — event-derived show profit projections from `financial_events`.
 *
 * profit = payout_after_fees − SUM(show-linked settlement amounts)
 * Payout and settlement amounts come from latest ledger events per source.
 */
import { roundMoney } from './event-adjusted-cash';
import {
  SETTLEMENT_OBLIGATION_EVENT_TYPES,
  SETTLEMENT_VOIDED_EVENT_TYPE,
} from './financial-obligation-projections';
import { toYyyyMmDd } from '../utils/pg-date';
import type { QueryableDb } from '../read-models/db';

export const SHOW_PAYOUT_EVENT_TYPES = ['SHOW_PAYOUT_RECORDED', 'SHOW_PAYOUT_UPDATED'] as const;

export type ShowFinancialProfitRow = {
  show_id: string;
  show_status: string | null;
  show_date: string | null;
  payout_after_fees_amount: string;
  owed_total: string;
  /** Null when show is not COMPLETED (excluded from closed-profit rollups). */
  profit: string | null;
  settlement_count: number;
  included_in_profit: boolean;
};

export type CompletedShowProfitWindow = {
  from: string;
  to: string;
  show_count: number;
  total_profit: string;
};

export function formatShowProfitAmount(amount: number): string {
  return String(roundMoney(amount));
}

export function computeShowProfit(payoutAfterFees: number, owedTotal: number): number {
  return roundMoney(payoutAfterFees - owedTotal);
}

function rowFromParts(
  showId: string,
  showStatus: string | null,
  showDate: string | null,
  payout: number,
  owed: number,
  settlementCount: number
): ShowFinancialProfitRow {
  const included = showStatus === 'COMPLETED';
  const profit = included ? computeShowProfit(payout, owed) : null;
  return {
    show_id: showId,
    show_status: showStatus,
    show_date: showDate,
    payout_after_fees_amount: formatShowProfitAmount(payout),
    owed_total: formatShowProfitAmount(owed),
    profit: profit != null ? formatShowProfitAmount(profit) : null,
    settlement_count: settlementCount,
    included_in_profit: included,
  };
}

async function loadLatestPayoutByShow(
  db: QueryableDb,
  showIds?: string[]
): Promise<
  Map<
    string,
    {
      payout: number;
      show_status: string | null;
      show_date: string | null;
    }
  >
> {
  const params: unknown[] = [SHOW_PAYOUT_EVENT_TYPES];
  let showFilter = '';
  if (showIds != null && showIds.length > 0) {
    params.push(showIds);
    showFilter = 'AND source_id = ANY($2::uuid[])';
  }

  const result = await db.query(
    `WITH latest_payout AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         COALESCE(amount::numeric, (payload->>'payout_after_fees_amount')::numeric, 0) AS payout,
         payload
       FROM financial_events
       WHERE source_type = 'show_financials'
         AND event_type = ANY($1::text[])
         ${showFilter}
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT
       source_id::text AS show_id,
       payout::text AS payout,
       payload->>'show_status' AS show_status,
       payload->>'show_date' AS show_date
     FROM latest_payout`,
    params
  );

  const map = new Map<
    string,
    { payout: number; show_status: string | null; show_date: string | null }
  >();
  for (const row of result.rows as Array<{
    show_id: string;
    payout: string;
    show_status: string | null;
    show_date: string | null;
  }>) {
    map.set(row.show_id, {
      payout: Number(row.payout) || 0,
      show_status: row.show_status,
      show_date: row.show_date != null ? toYyyyMmDd(row.show_date) : null,
    });
  }
  return map;
}

async function loadShowLinkedOwedByShow(
  db: QueryableDb,
  showIds?: string[]
): Promise<Map<string, { owed: number; settlement_count: number }>> {
  const params: unknown[] = [SETTLEMENT_OBLIGATION_EVENT_TYPES, SETTLEMENT_VOIDED_EVENT_TYPE];
  let showFilter = '';
  if (showIds != null && showIds.length > 0) {
    params.push(showIds);
    showFilter = `AND payload->>'show_id' = ANY($3::text[])`;
  }

  const result = await db.query(
    `WITH latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount,
         payload
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($1::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT
       payload->>'show_id' AS show_id,
       COALESCE(SUM(amount), 0)::numeric AS owed_total,
       COUNT(*)::int AS settlement_count
     FROM latest_settlement
     WHERE event_type <> $2
       AND payload->>'show_id' IS NOT NULL
       AND COALESCE(payload->>'obligation_kind', 'SHOW_LINKED') = 'SHOW_LINKED'
       ${showFilter}
     GROUP BY payload->>'show_id'`,
    params
  );

  const map = new Map<string, { owed: number; settlement_count: number }>();
  for (const row of result.rows as Array<{
    show_id: string;
    owed_total: string;
    settlement_count: number;
  }>) {
    map.set(row.show_id, {
      owed: Number(row.owed_total) || 0,
      settlement_count: Number(row.settlement_count) || 0,
    });
  }
  return map;
}

function buildProfitRow(
  showId: string,
  payoutMap: Map<string, { payout: number; show_status: string | null; show_date: string | null }>,
  owedMap: Map<string, { owed: number; settlement_count: number }>
): ShowFinancialProfitRow | null {
  const payoutRow = payoutMap.get(showId);
  if (!payoutRow) return null;
  const owedRow = owedMap.get(showId);
  return rowFromParts(
    showId,
    payoutRow.show_status,
    payoutRow.show_date,
    payoutRow.payout,
    owedRow?.owed ?? 0,
    owedRow?.settlement_count ?? 0
  );
}

/** Event-derived profit for one show; null when no payout ledger event exists. */
export async function loadShowFinancialProfit(
  db: QueryableDb,
  showId: string
): Promise<ShowFinancialProfitRow | null> {
  const [payoutMap, owedMap] = await Promise.all([
    loadLatestPayoutByShow(db, [showId]),
    loadShowLinkedOwedByShow(db, [showId]),
  ]);
  return buildProfitRow(showId, payoutMap, owedMap);
}

/** Batch event-derived profit keyed by show id (omits shows without payout events). */
export async function loadShowProfitsForShows(
  db: QueryableDb,
  showIds: string[]
): Promise<Map<string, ShowFinancialProfitRow>> {
  const uniqueIds = [...new Set(showIds.filter(Boolean))];
  const out = new Map<string, ShowFinancialProfitRow>();
  if (uniqueIds.length === 0) return out;

  const [payoutMap, owedMap] = await Promise.all([
    loadLatestPayoutByShow(db, uniqueIds),
    loadShowLinkedOwedByShow(db, uniqueIds),
  ]);

  for (const showId of uniqueIds) {
    const row = buildProfitRow(showId, payoutMap, owedMap);
    if (row) out.set(showId, row);
  }
  return out;
}

/**
 * Sum profit for COMPLETED shows whose show_date falls in [from, to] (inclusive).
 * Uses latest payout event per show; excludes non-completed shows.
 */
export async function loadCompletedShowProfitInDateWindow(
  db: QueryableDb,
  from: string,
  to: string
): Promise<CompletedShowProfitWindow> {
  const result = await db.query(
    `WITH latest_payout AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         COALESCE(amount::numeric, (payload->>'payout_after_fees_amount')::numeric, 0) AS payout,
         payload
       FROM financial_events
       WHERE source_type = 'show_financials'
         AND event_type = ANY($3::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     ),
     eligible AS (
       SELECT
         source_id::text AS show_id,
         payout
       FROM latest_payout
       WHERE payload->>'show_status' = 'COMPLETED'
         AND (payload->>'show_date')::date >= $1::date
         AND (payload->>'show_date')::date <= $2::date
     ),
     latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount,
         payload
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($4::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     ),
     owed_by_show AS (
       SELECT
         payload->>'show_id' AS show_id,
         COALESCE(SUM(amount), 0)::numeric AS owed_total
       FROM latest_settlement
       WHERE event_type <> $5
         AND payload->>'show_id' IS NOT NULL
         AND COALESCE(payload->>'obligation_kind', 'SHOW_LINKED') = 'SHOW_LINKED'
       GROUP BY payload->>'show_id'
     )
     SELECT
       COUNT(*)::int AS show_count,
       COALESCE(SUM(e.payout - COALESCE(o.owed_total, 0)), 0)::numeric AS total_profit
     FROM eligible e
     LEFT JOIN owed_by_show o ON o.show_id = e.show_id`,
    [
      from,
      to,
      SHOW_PAYOUT_EVENT_TYPES,
      SETTLEMENT_OBLIGATION_EVENT_TYPES,
      SETTLEMENT_VOIDED_EVENT_TYPE,
    ]
  );

  const row = result.rows[0] as { show_count: number; total_profit: string };
  return {
    from,
    to,
    show_count: Number(row.show_count) || 0,
    total_profit: formatShowProfitAmount(Number(row.total_profit) || 0),
  };
}
