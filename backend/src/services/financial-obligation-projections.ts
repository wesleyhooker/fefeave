/**
 * Phase 7b — event-derived obligation and payment projections from `financial_events`.
 *
 * Authoritative for wholesaler/account balance totals. Operational CRUD and statement
 * drilldowns may still read domain tables for labels and form fields.
 */
import { roundMoney } from './event-adjusted-cash';
import { toYyyyMmDd } from '../utils/pg-date';
import type { QueryableDb } from '../read-models/db';

export const SETTLEMENT_OBLIGATION_EVENT_TYPES = [
  'SETTLEMENT_CREATED',
  'SETTLEMENT_ADJUSTED',
  'SETTLEMENT_VOIDED',
] as const;

export const SETTLEMENT_VOIDED_EVENT_TYPE = 'SETTLEMENT_VOIDED';

export type WholesalerObligationFilters = {
  wholesalerId?: string;
  accountId?: string;
};

export type WholesalerObligationTotals = {
  wholesaler_id: string;
  account_id: string;
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date: string | null;
};

export type AccountFinancialTotals = {
  owed_total: string;
  paid_total: string;
  balance_owed: string;
  last_payment_date: string | null;
  self_pay_total: string;
  last_self_pay_at: string | null;
};

type ObligationEventRow = {
  wholesaler_id: string | null;
  account_id: string | null;
  amount: string;
};

type PaymentEventRow = {
  wholesaler_id: string | null;
  account_id: string | null;
  amount: string;
  payment_date: string | null;
};

type WholesalerAccountRow = {
  id: string;
  legacy_wholesaler_id: string;
  display_name: string;
  pay_schedule: string;
};

/** Format obligation/payment totals to match legacy numeric::text API responses. */
export function formatObligationTotal(amount: number): string {
  return String(roundMoney(amount));
}

function formatBalanceOwed(owed: number, paid: number): string {
  return (roundMoney(owed) - roundMoney(paid)).toFixed(4);
}

function matchesAccountScope(
  row: { account_id: string | null; wholesaler_id: string | null },
  account: { id: string; legacy_wholesaler_id: string }
): boolean {
  if (row.account_id != null && row.account_id === account.id) return true;
  if (row.account_id == null && row.wholesaler_id === account.legacy_wholesaler_id) return true;
  return false;
}

async function loadActiveObligationEventRows(db: QueryableDb): Promise<ObligationEventRow[]> {
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
       payload->>'wholesaler_id' AS wholesaler_id,
       payload->>'account_id' AS account_id,
       amount::text AS amount
     FROM latest_settlement
     WHERE event_type <> $2`,
    [SETTLEMENT_OBLIGATION_EVENT_TYPES, SETTLEMENT_VOIDED_EVENT_TYPE]
  );
  return result.rows as ObligationEventRow[];
}

async function loadPaymentEventRows(db: QueryableDb): Promise<PaymentEventRow[]> {
  const result = await db.query(
    `SELECT
       payload->>'wholesaler_id' AS wholesaler_id,
       payload->>'account_id' AS account_id,
       amount::text AS amount,
       effective_date::text AS payment_date
     FROM financial_events
     WHERE event_type = 'WHOLESALER_PAYMENT_RECORDED'
       AND amount IS NOT NULL`
  );
  return result.rows as PaymentEventRow[];
}

/**
 * Latest non-void settlement amount per owed_line_item source_id.
 * Authority: latest SETTLEMENT_CREATED / SETTLEMENT_ADJUSTED; void excludes source.
 */
export async function loadLatestSettlementAmountBySource(
  db: QueryableDb,
  sourceId?: string
): Promise<Map<string, number>> {
  const params: unknown[] = [SETTLEMENT_OBLIGATION_EVENT_TYPES, SETTLEMENT_VOIDED_EVENT_TYPE];
  let sourceFilter = '';
  if (sourceId != null) {
    params.push(sourceId);
    sourceFilter = 'AND source_id = $3';
  }

  const result = await db.query(
    `WITH latest_settlement AS (
       SELECT DISTINCT ON (source_id)
         source_id,
         event_type,
         COALESCE(amount::numeric, (payload->>'amount')::numeric, 0) AS amount
       FROM financial_events
       WHERE source_type = 'owed_line_item'
         AND event_type = ANY($1::text[])
         ${sourceFilter}
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT source_id, amount::text AS amount
     FROM latest_settlement
     WHERE event_type <> $2`,
    params
  );

  const map = new Map<string, number>();
  for (const row of result.rows as Array<{ source_id: string; amount: string }>) {
    map.set(row.source_id, Number(row.amount) || 0);
  }
  return map;
}

/** Sum active (non-void) settlement obligations for one wholesaler. */
export async function sumObligationsForWholesaler(
  db: QueryableDb,
  wholesalerId: string
): Promise<number> {
  const rows = await loadActiveObligationEventRows(db);
  return rows
    .filter((row) => row.wholesaler_id === wholesalerId)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

/** Sum wholesaler payment events for one wholesaler. */
export async function sumPaymentsForWholesaler(
  db: QueryableDb,
  wholesalerId: string
): Promise<number> {
  const rows = await loadPaymentEventRows(db);
  return rows
    .filter((row) => row.wholesaler_id === wholesalerId)
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

async function loadWholesalerAccounts(
  db: QueryableDb,
  filters?: WholesalerObligationFilters
): Promise<WholesalerAccountRow[]> {
  const params: unknown[] = [];
  const conditions = [
    'a.deleted_at IS NULL',
    "a.type = 'WHOLESALER'",
    'a.legacy_wholesaler_id IS NOT NULL',
  ];

  if (filters?.accountId) {
    params.push(filters.accountId);
    conditions.push(`a.id = $${params.length}`);
  }
  if (filters?.wholesalerId) {
    params.push(filters.wholesalerId);
    conditions.push(`a.legacy_wholesaler_id = $${params.length}`);
  }

  const result = await db.query(
    `SELECT
       a.id,
       a.legacy_wholesaler_id,
       a.display_name,
       COALESCE(a.pay_schedule::text, 'AD_HOC') AS pay_schedule
     FROM accounts a
     WHERE ${conditions.join(' AND ')}
     ORDER BY LOWER(a.display_name) ASC, a.id ASC`,
    params
  );
  return result.rows as WholesalerAccountRow[];
}

function aggregateForAccount(
  account: WholesalerAccountRow,
  obligations: ObligationEventRow[],
  payments: PaymentEventRow[]
): { owed: number; paid: number; lastPaymentDate: string | null } {
  let owed = 0;
  for (const row of obligations) {
    if (matchesAccountScope(row, account)) {
      owed += Number(row.amount) || 0;
    }
  }

  let paid = 0;
  let lastPaymentDate: string | null = null;
  for (const row of payments) {
    if (!matchesAccountScope(row, account)) continue;
    paid += Number(row.amount) || 0;
    if (row.payment_date != null) {
      const normalized = toYyyyMmDd(row.payment_date);
      if (lastPaymentDate == null || normalized > lastPaymentDate) {
        lastPaymentDate = normalized;
      }
    }
  }

  return { owed, paid, lastPaymentDate };
}

/**
 * Event-derived wholesaler obligation totals (one row per wholesaler account).
 */
export async function loadWholesalerObligationTotals(
  db: QueryableDb,
  filters?: WholesalerObligationFilters
): Promise<WholesalerObligationTotals[]> {
  const accounts = await loadWholesalerAccounts(db, filters);
  if (accounts.length === 0) return [];

  const obligations = await loadActiveObligationEventRows(db);
  const payments = await loadPaymentEventRows(db);

  return accounts.map((account) => {
    const { owed, paid, lastPaymentDate } = aggregateForAccount(account, obligations, payments);
    return {
      wholesaler_id: account.legacy_wholesaler_id,
      account_id: account.id,
      owed_total: formatObligationTotal(owed),
      paid_total: formatObligationTotal(paid),
      balance_owed: formatBalanceOwed(owed, paid),
      last_payment_date: lastPaymentDate,
    };
  });
}

async function loadOwnerSelfPayTotals(db: QueryableDb): Promise<{
  self_pay_total: string;
  last_self_pay_at: string | null;
}> {
  const result = await db.query(
    `WITH latest_owner AS (
       SELECT DISTINCT ON (source_id)
         amount::numeric AS amount,
         event_type,
         payload
       FROM financial_events
       WHERE source_type = 'owner_self_pay'
         AND event_type = ANY($1::text[])
       ORDER BY source_id, occurred_at DESC, id DESC
     )
     SELECT
       COALESCE(SUM(amount), 0)::numeric AS total,
       MAX((payload->>'paid_at')::timestamptz) AS last_paid_at
     FROM latest_owner
     WHERE event_type <> ALL($2::text[])
       AND amount IS NOT NULL`,
    [
      [
        'OWNER_DRAW_RECORDED',
        'OWNER_SELF_PAY_RECORDED',
        'OWNER_DRAW_CORRECTED',
        'OWNER_SELF_PAY_CORRECTED',
        'OWNER_DRAW_VOIDED',
        'OWNER_SELF_PAY_VOIDED',
      ],
      ['OWNER_DRAW_VOIDED', 'OWNER_SELF_PAY_VOIDED'],
    ]
  );

  const row = result.rows[0] as { total: string; last_paid_at: Date | null };
  return {
    self_pay_total: formatObligationTotal(Number(row.total) || 0),
    last_self_pay_at: row.last_paid_at != null ? new Date(row.last_paid_at).toISOString() : null,
  };
}

/** Event-derived financial totals for a single account (wholesaler or owner). */
export async function loadAccountFinancialTotals(
  db: QueryableDb,
  accountId: string
): Promise<AccountFinancialTotals> {
  const accountResult = await db.query(
    `SELECT id, type::text AS type, legacy_wholesaler_id
     FROM accounts
     WHERE id = $1 AND deleted_at IS NULL`,
    [accountId]
  );
  if (accountResult.rows.length === 0) {
    return {
      owed_total: '0',
      paid_total: '0',
      balance_owed: '0.0000',
      last_payment_date: null,
      self_pay_total: '0',
      last_self_pay_at: null,
    };
  }

  const account = accountResult.rows[0] as {
    id: string;
    type: 'OWNER' | 'WHOLESALER';
    legacy_wholesaler_id: string | null;
  };

  if (account.type === 'OWNER') {
    const ownerTotals = await loadOwnerSelfPayTotals(db);
    return {
      owed_total: '0',
      paid_total: '0',
      balance_owed: '0.0000',
      last_payment_date: null,
      self_pay_total: ownerTotals.self_pay_total,
      last_self_pay_at: ownerTotals.last_self_pay_at,
    };
  }

  if (account.legacy_wholesaler_id == null) {
    return {
      owed_total: '0',
      paid_total: '0',
      balance_owed: '0.0000',
      last_payment_date: null,
      self_pay_total: '0',
      last_self_pay_at: null,
    };
  }

  const [totals] = await loadWholesalerObligationTotals(db, { accountId });
  return {
    owed_total: totals?.owed_total ?? '0',
    paid_total: totals?.paid_total ?? '0',
    balance_owed: totals?.balance_owed ?? '0.0000',
    last_payment_date: totals?.last_payment_date ?? null,
    self_pay_total: '0',
    last_self_pay_at: null,
  };
}

/** Batch account totals for GET /accounts list enrichment. */
export async function loadAllAccountFinancialTotals(
  db: QueryableDb
): Promise<Map<string, AccountFinancialTotals>> {
  const accountsResult = await db.query(
    `SELECT id, type::text AS type
     FROM accounts
     WHERE deleted_at IS NULL`
  );

  const obligations = await loadActiveObligationEventRows(db);
  const payments = await loadPaymentEventRows(db);
  const wholesalerAccounts = await loadWholesalerAccounts(db);
  const ownerTotals = await loadOwnerSelfPayTotals(db);

  const map = new Map<string, AccountFinancialTotals>();

  for (const row of accountsResult.rows as Array<{ id: string; type: 'OWNER' | 'WHOLESALER' }>) {
    if (row.type === 'OWNER') {
      map.set(row.id, {
        owed_total: '0',
        paid_total: '0',
        balance_owed: '0.0000',
        last_payment_date: null,
        self_pay_total: ownerTotals.self_pay_total,
        last_self_pay_at: ownerTotals.last_self_pay_at,
      });
      continue;
    }

    const account = wholesalerAccounts.find((a) => a.id === row.id);
    if (!account) {
      map.set(row.id, {
        owed_total: '0',
        paid_total: '0',
        balance_owed: '0.0000',
        last_payment_date: null,
        self_pay_total: '0',
        last_self_pay_at: null,
      });
      continue;
    }

    const { owed, paid, lastPaymentDate } = aggregateForAccount(account, obligations, payments);
    map.set(row.id, {
      owed_total: formatObligationTotal(owed),
      paid_total: formatObligationTotal(paid),
      balance_owed: formatBalanceOwed(owed, paid),
      last_payment_date: lastPaymentDate,
      self_pay_total: '0',
      last_self_pay_at: null,
    });
  }

  return map;
}
