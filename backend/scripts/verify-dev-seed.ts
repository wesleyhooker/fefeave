/**
 * Dev-only: verify local seed + event-backed Financials mock data.
 *
 * Usage: DATABASE_URL=... npm run seed:verify
 * Or: make dev-seed-verify
 *
 * DB metrics always run. API metrics run when localhost:3000 is reachable
 * (optional — skipped with a note if backend is down).
 */
import { Client } from 'pg';

const API_BASE = (process.env.DEV_API_BASE ?? 'http://localhost:3000/api').replace(/\/$/, '');
const DEV_BYPASS_TOKEN = 'fefeave-local-dev-bootstrap';
const SEED_SHOW_NAMES = [
  'Seed Show This Week Active',
  'Seed Show This Week Closed',
  'Seed Show Next Week Planned',
] as const;
const SEED_PAYMENT_REFERENCES = ['seed-partial', 'seed-full'] as const;
const SEED_MARKER = '(seed-dev)';
const MIN_SEED_FINANCIAL_EVENTS = 14;
const PROFIT_WINDOW_FROM = '2020-01-01';
const PROFIT_WINDOW_TO = '2030-12-31';

type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

async function fetchApi<T>(path: string): Promise<ApiResult<T>> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${DEV_BYPASS_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: message };
  }
}

function printRow(label: string, value: string | number, ok?: boolean): void {
  const suffix = ok === undefined ? '' : ok ? ' ✓' : ' ✗';
  console.log(`  ${label}: ${value}${suffix}`);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  let financialEventsCount = 0;
  let cashSnapshotCount = 0;
  let seedFinancialEventsCount = 0;

  try {
    const fe = await client.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM financial_events');
    financialEventsCount = fe.rows[0]?.n ?? 0;

    const seedFe = await client.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM financial_events fe
       WHERE fe.source_id IN (
         SELECT id FROM shows WHERE deleted_at IS NULL AND name = ANY($1::text[])
         UNION SELECT id FROM payments WHERE reference = ANY($2::text[])
         UNION SELECT id FROM business_expenses WHERE notes LIKE $3
         UNION SELECT id FROM inventory_purchases
           WHERE notes LIKE $3 OR supplier LIKE $3
         UNION SELECT id FROM cash_snapshots WHERE notes LIKE $3
         UNION SELECT id FROM owner_self_pay_transactions WHERE reference = 'seed-owner-draw'
         UNION SELECT id FROM financial_strategy_settings WHERE scope_key = 'global'
         UNION SELECT id FROM owed_line_items
           WHERE show_id IN (SELECT id FROM shows WHERE deleted_at IS NULL AND name = ANY($1::text[]))
           OR (
             obligation_kind = 'VENDOR_EXPENSE'
             AND description LIKE $3
           )
       )`,
      [SEED_SHOW_NAMES, SEED_PAYMENT_REFERENCES, `%${SEED_MARKER}%`]
    );
    seedFinancialEventsCount = seedFe.rows[0]?.n ?? 0;

    const cs = await client.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM cash_snapshots');
    cashSnapshotCount = cs.rows[0]?.n ?? 0;
  } finally {
    await client.end();
  }

  console.log('Dev seed verification (local only)');
  console.log('==================================');
  console.log('');
  console.log('Database');
  printRow('financial_events count', financialEventsCount, financialEventsCount > 0);
  printRow(
    'seed-linked financial_events',
    seedFinancialEventsCount,
    seedFinancialEventsCount >= MIN_SEED_FINANCIAL_EVENTS
  );
  printRow('cash_snapshots count', cashSnapshotCount, cashSnapshotCount > 0);

  console.log('');
  console.log('API (requires make dev-api on :3000)');

  type ActivityResponse = { pagination: { total: number } };
  type ProfitResponse = { show_count: number; total_profit: string };
  type BalanceRow = { name: string; balance_owed: string };
  type RecommendationsResponse = { available: boolean; current_cash?: string };

  const health = await fetchApi<{ status: string }>('/health');
  const apiUp = health.ok;

  let activityTotal = 0;
  let profitTotal = 'n/a';
  let nonZeroBalances = 0;
  let recommendationsAvailable = false;
  let currentCash: string | undefined;

  if (!apiUp) {
    printRow('backend reachable', `no (${health.error})`);
    console.log('');
    console.log('Skipped API metrics — start backend with make dev-api or make dev.');
  } else {
    printRow('backend reachable', 'yes ✓');

    const activity = await fetchApi<ActivityResponse>('/financial-activity?page=1&limit=1');
    activityTotal = activity.ok ? activity.data.pagination.total : 0;
    printRow(
      'Activity event count',
      activity.ok ? activityTotal : `unavailable (${activity.error})`,
      activity.ok && activityTotal > 0
    );

    const profit = await fetchApi<ProfitResponse>(
      `/shows/completed-profit?from=${PROFIT_WINDOW_FROM}&to=${PROFIT_WINDOW_TO}`
    );
    profitTotal = profit.ok ? profit.data.total_profit : 'n/a';
    printRow(
      'completed show profit total',
      profit.ok ? profitTotal : `unavailable (${profit.error})`,
      profit.ok && Number(profitTotal) > 0
    );

    const balances = await fetchApi<BalanceRow[]>('/wholesalers/balances');
    nonZeroBalances = balances.ok
      ? balances.data.filter((row) => Number(row.balance_owed) > 0).length
      : 0;
    printRow(
      'non-zero wholesaler balance count',
      balances.ok ? nonZeroBalances : `unavailable (${balances.error})`,
      balances.ok && nonZeroBalances > 0
    );

    const recommendations = await fetchApi<RecommendationsResponse>('/financial-recommendations');
    recommendationsAvailable = recommendations.ok && recommendations.data.available === true;
    currentCash = recommendations.ok ? recommendations.data.current_cash : undefined;
    printRow(
      'recommendations available',
      recommendations.ok
        ? String(recommendations.data.available)
        : `unavailable (${recommendations.error})`,
      recommendationsAvailable
    );
    if (currentCash != null) {
      printRow('recommendations current_cash', currentCash);
    }
  }

  console.log('');
  const dbOk =
    financialEventsCount > 0 &&
    seedFinancialEventsCount >= MIN_SEED_FINANCIAL_EVENTS &&
    cashSnapshotCount > 0;
  const apiOk =
    apiUp &&
    activityTotal > 0 &&
    Number(profitTotal) > 0 &&
    nonZeroBalances > 0 &&
    recommendationsAvailable;

  if (dbOk && apiOk) {
    console.log('Result: PASS — dev seed looks ready for Financials UI work.');
  } else if (dbOk && !apiUp) {
    console.log('Result: PASS (DB only) — run make dev-api then re-check for full API validation.');
  } else {
    console.log('Result: FAIL — run make dev-reset or make dev-seed and fix issues above.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
