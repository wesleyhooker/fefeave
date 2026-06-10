/**
 * Dev-only seed: idempotent "delete seed namespace then insert".
 * Uses deterministic names so we only ever delete/insert our own seed data.
 * Never touches prod; safe to run repeatedly (make dev-seed).
 *
 * Writes operational domain rows, then runs the same financial-events backfill
 * used in prod/staging so event-backed Financials pages have realistic data.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/seed-dev.ts
 * Or: make dev-seed (uses LOCAL_DB_URL if DATABASE_URL unset)
 */

import { Client } from 'pg';
import { runFinancialEventsBackfill } from '../src/services/financial-events-backfill';

const SEED_USER_COGNITO_ID = 'seed-dev-user';
const SEED_USER_EMAIL = 'local@fefeave.local';
const SEED_USER_ROLE = 'ADMIN';

/** Marker in notes/descriptions for non-name seed rows. */
const SEED_MARKER = '(seed-dev)';

// Deterministic names for "seed namespace" (delete only these)
const SEED_WHOLESALER_NAMES = [
  'Seed Wholesaler A (ASAP)',
  'Seed Wholesaler B (batch)',
  'Seed Mom Inventory',
] as const;
const SEED_SHOW_NAMES = [
  'Seed Show This Week Active',
  'Seed Show This Week Closed',
  'Seed Show Next Week Planned',
] as const;
const SEED_PAYMENT_REFERENCES = ['seed-partial', 'seed-full'] as const;
const SEED_OWNER_DRAW_REFERENCE = 'seed-owner-draw';

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMondayLocal(now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDaysLocal(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Collect source_ids for seed rows so financial_events can be removed before domain deletes. */
async function collectSeedFinancialEventSourceIds(client: Client): Promise<string[]> {
  const ids = new Set<string>();

  const pushRows = (rows: Array<{ id: string }>) => {
    for (const row of rows) ids.add(row.id);
  };

  pushRows(
    (
      await client.query(
        `SELECT id FROM shows WHERE deleted_at IS NULL AND name = ANY($1::text[])`,
        [SEED_SHOW_NAMES]
      )
    ).rows as Array<{ id: string }>
  );

  const seedWholesalerIds = (
    await client.query(
      `SELECT id FROM wholesalers WHERE deleted_at IS NULL AND name = ANY($1::text[])`,
      [SEED_WHOLESALER_NAMES]
    )
  ).rows.map((r) => r.id as string);

  if (seedWholesalerIds.length > 0) {
    pushRows(
      (
        await client.query(`SELECT id FROM payments WHERE wholesaler_id = ANY($1::uuid[])`, [
          seedWholesalerIds,
        ])
      ).rows as Array<{ id: string }>
    );
  }

  pushRows(
    (
      await client.query(`SELECT id FROM payments WHERE reference = ANY($1::text[])`, [
        SEED_PAYMENT_REFERENCES,
      ])
    ).rows as Array<{ id: string }>
  );

  const seedShowIds = (
    await client.query(`SELECT id FROM shows WHERE deleted_at IS NULL AND name = ANY($1::text[])`, [
      SEED_SHOW_NAMES,
    ])
  ).rows.map((r) => r.id as string);

  if (seedShowIds.length > 0) {
    pushRows(
      (
        await client.query(`SELECT id FROM owed_line_items WHERE show_id = ANY($1::uuid[])`, [
          seedShowIds,
        ])
      ).rows as Array<{ id: string }>
    );
  }

  pushRows(
    (
      await client.query(
        `SELECT id FROM owed_line_items
         WHERE deleted_at IS NULL
           AND obligation_kind = 'VENDOR_EXPENSE'
           AND description LIKE $1`,
        [`%${SEED_MARKER}%`]
      )
    ).rows as Array<{ id: string }>
  );

  pushRows(
    (
      await client.query(`SELECT id FROM business_expenses WHERE notes LIKE $1`, [
        `%${SEED_MARKER}%`,
      ])
    ).rows as Array<{ id: string }>
  );

  pushRows(
    (
      await client.query(
        `SELECT id FROM inventory_purchases
         WHERE notes LIKE $1 OR supplier LIKE $1`,
        [`%${SEED_MARKER}%`]
      )
    ).rows as Array<{ id: string }>
  );

  pushRows(
    (await client.query(`SELECT id FROM cash_snapshots WHERE notes LIKE $1`, [`%${SEED_MARKER}%`]))
      .rows as Array<{ id: string }>
  );

  pushRows(
    (
      await client.query(`SELECT id FROM owner_self_pay_transactions WHERE reference = $1`, [
        SEED_OWNER_DRAW_REFERENCE,
      ])
    ).rows as Array<{ id: string }>
  );

  pushRows(
    (await client.query(`SELECT id FROM financial_strategy_settings WHERE scope_key = 'global'`))
      .rows as Array<{ id: string }>
  );

  return [...ids];
}

async function deleteSeedFinancialEvents(client: Client, sourceIds: string[]): Promise<number> {
  if (sourceIds.length === 0) return 0;
  const result = await client.query(
    `DELETE FROM financial_events WHERE source_id = ANY($1::uuid[])`,
    [sourceIds]
  );
  return result.rowCount ?? 0;
}

async function deleteSeedNamespace(client: Client): Promise<void> {
  const eventSourceIds = await collectSeedFinancialEventSourceIds(client);
  await deleteSeedFinancialEvents(client, eventSourceIds);

  await client.query(`DELETE FROM payments WHERE reference = ANY($1::text[])`, [
    SEED_PAYMENT_REFERENCES,
  ]);
  await client.query(`DELETE FROM owner_self_pay_transactions WHERE reference = $1`, [
    SEED_OWNER_DRAW_REFERENCE,
  ]);
  await client.query(`DELETE FROM business_expenses WHERE notes LIKE $1`, [`%${SEED_MARKER}%`]);
  await client.query(`DELETE FROM inventory_purchases WHERE notes LIKE $1 OR supplier LIKE $1`, [
    `%${SEED_MARKER}%`,
  ]);
  await client.query(`DELETE FROM cash_snapshots WHERE notes LIKE $1`, [`%${SEED_MARKER}%`]);
  await client.query(
    `DELETE FROM owed_line_items
     WHERE deleted_at IS NULL
       AND obligation_kind = 'VENDOR_EXPENSE'
       AND description LIKE $1`,
    [`%${SEED_MARKER}%`]
  );

  const seedWholesalerIds = await client.query(
    `SELECT id FROM wholesalers WHERE deleted_at IS NULL AND name = ANY($1::text[])`,
    [SEED_WHOLESALER_NAMES]
  );
  const idsW = seedWholesalerIds.rows.map((r) => r.id as string);

  const seedShowIds = await client.query(
    `SELECT id FROM shows WHERE deleted_at IS NULL AND name = ANY($1::text[])`,
    [SEED_SHOW_NAMES]
  );
  const idsS = seedShowIds.rows.map((r) => r.id as string);

  if (idsW.length > 0) {
    await client.query(`DELETE FROM payments WHERE wholesaler_id = ANY($1::uuid[])`, [idsW]);
  }
  if (idsS.length > 0) {
    await client.query(`DELETE FROM owed_line_items WHERE show_id = ANY($1::uuid[])`, [idsS]);
    await client.query(`DELETE FROM show_financials WHERE show_id = ANY($1::uuid[])`, [idsS]);
    await client.query(`DELETE FROM shows WHERE id = ANY($1::uuid[])`, [idsS]);
  }
  if (idsW.length > 0) {
    await client.query(`DELETE FROM accounts WHERE legacy_wholesaler_id = ANY($1::uuid[])`, [idsW]);
    await client.query(`DELETE FROM wholesalers WHERE id = ANY($1::uuid[])`, [idsW]);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const weekStart = startOfWeekMondayLocal();
  const weekEnd = addDaysLocal(weekStart, 6);
  const snapshotDate = formatYmdLocal(addDaysLocal(weekStart, -7));
  const activityDate = formatYmdLocal(addDaysLocal(weekStart, 2));
  const activeShowDate = formatYmdLocal(addDaysLocal(weekStart, 3));
  const completedShowDate = formatYmdLocal(addDaysLocal(weekStart, 5));
  const plannedShowDate = formatYmdLocal(addDaysLocal(weekStart, 10));

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET cognito_user_id = EXCLUDED.cognito_user_id, role = EXCLUDED.role, updated_at = NOW()
       RETURNING id`,
      [SEED_USER_COGNITO_ID, SEED_USER_EMAIL, SEED_USER_ROLE]
    );
    const userId = userRes.rows[0].id as string;

    const ownerAccountRes = await client.query(
      `INSERT INTO accounts (display_name, type, status, linked_user_id, notes)
       VALUES ('Felicia', 'OWNER', 'ACTIVE', $1, 'Default owner account')
       ON CONFLICT (type) WHERE (type = 'OWNER'::account_type)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         status = EXCLUDED.status,
         linked_user_id = EXCLUDED.linked_user_id,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING id`,
      [userId]
    );
    const ownerAccountId = ownerAccountRes.rows[0].id as string;

    await deleteSeedNamespace(client);

    const w1 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Wholesaler A (ASAP)', `Usually paid next day. ${SEED_MARKER}`]
    );
    const w2 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Wholesaler B (batch)', `Usually paid in batches every 2 weeks. ${SEED_MARKER}`]
    );
    const w3 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Mom Inventory', `Mom inventory; track like any wholesaler. ${SEED_MARKER}`]
    );
    const wid1 = w1.rows[0].id as string;
    const wid2 = w2.rows[0].id as string;
    const wid3 = w3.rows[0].id as string;

    const a1 = await client.query(
      `INSERT INTO accounts (display_name, type, status, notes, pay_schedule, legacy_wholesaler_id)
       VALUES ($1, 'WHOLESALER', 'ACTIVE', $2, 'AD_HOC', $3)
       ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         notes = EXCLUDED.notes,
         pay_schedule = EXCLUDED.pay_schedule,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id`,
      ['Seed Wholesaler A (ASAP)', `Usually paid next day. ${SEED_MARKER}`, wid1]
    );
    const a2 = await client.query(
      `INSERT INTO accounts (display_name, type, status, notes, pay_schedule, legacy_wholesaler_id)
       VALUES ($1, 'WHOLESALER', 'ACTIVE', $2, 'AD_HOC', $3)
       ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         notes = EXCLUDED.notes,
         pay_schedule = EXCLUDED.pay_schedule,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id`,
      ['Seed Wholesaler B (batch)', `Usually paid in batches every 2 weeks. ${SEED_MARKER}`, wid2]
    );
    const a3 = await client.query(
      `INSERT INTO accounts (display_name, type, status, notes, pay_schedule, legacy_wholesaler_id)
       VALUES ($1, 'WHOLESALER', 'ACTIVE', $2, 'AD_HOC', $3)
       ON CONFLICT (legacy_wholesaler_id) WHERE (legacy_wholesaler_id IS NOT NULL)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         notes = EXCLUDED.notes,
         pay_schedule = EXCLUDED.pay_schedule,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id`,
      ['Seed Mom Inventory', `Mom inventory; track like any wholesaler. ${SEED_MARKER}`, wid3]
    );
    const aid1 = a1.rows[0].id as string;
    const aid2 = a2.rows[0].id as string;
    const aid3 = a3.rows[0].id as string;

    // ACTIVE show — open close-out with percent + fixed settlements
    const show1 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show This Week Active', $1, 'WHATNOT', 'WHATNOT', 'ACTIVE', $2, 'API') RETURNING id`,
      [activeShowDate, userId]
    );
    const show1Id = show1.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, gross_sales_amount, platform_fee_amount, payout_after_fees_amount, currency)
       VALUES ($1, 1600, 400, 1200, 'USD')`,
      [show1Id]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, account_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, $3, 240, 'USD', 'Settlement 20%', 'PENDING', $4, 'API', 'PERCENT_PAYOUT', 2000, 1200)`,
      [show1Id, wid1, aid1, userId]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, account_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, $3, 120, 'USD', 'Settlement fixed', 'PENDING', $4, 'API', 'MANUAL', NULL, NULL)`,
      [show1Id, wid2, aid2, userId]
    );

    // COMPLETED show — dashboard / owner payout profit example (1500 payout − 300 settlement = 1200 profit)
    const show2 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show This Week Closed', $1, 'WHATNOT', 'WHATNOT', 'COMPLETED', $2, 'API') RETURNING id`,
      [completedShowDate, userId]
    );
    const show2Id = show2.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, gross_sales_amount, platform_fee_amount, payout_after_fees_amount, currency)
       VALUES ($1, 2200, 700, 1500, 'USD')`,
      [show2Id]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, account_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, $3, 300, 'USD', 'Settlement W3', 'PENDING', $4, 'API', 'MANUAL', NULL, NULL)`,
      [show2Id, wid3, aid3, userId]
    );

    // PLANNED show — upcoming, no financials yet
    await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show Next Week Planned', $1, 'WHATNOT', 'WHATNOT', 'PLANNED', $2, 'API')`,
      [plannedShowDate, userId]
    );

    // Vendor expense obligation (no show link)
    await client.query(
      `INSERT INTO owed_line_items (
         show_id, wholesaler_id, account_id, amount, currency, description, status,
         obligation_kind, due_date, calculation_method, created_by, created_via
       ) VALUES (
         NULL, $1, $2, 85, 'USD', $3, 'PENDING',
         'VENDOR_EXPENSE', $4, NULL, $5, 'API'
       )`,
      [wid1, aid1, `Seed vendor obligation ${SEED_MARKER}`, activityDate, userId]
    );

    // Payments — partial + full; W3 has none so "Last payment: —"
    await client.query(
      `INSERT INTO payments (wholesaler_id, account_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, $2, 50, 'USD', $3, 'CASH', 'seed-partial', $4, $5, 'API')`,
      [wid1, aid1, activityDate, `Seed partial payment ${SEED_MARKER}`, userId]
    );
    await client.query(
      `INSERT INTO payments (wholesaler_id, account_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, $2, 100, 'USD', $3, 'CASH', 'seed-full', $4, $5, 'API')`,
      [wid2, aid2, activityDate, `Seed full payment ${SEED_MARKER}`, userId]
    );

    // Business expenses — reseller overhead (8–15 rows, spread across last ~30 days)
    const seedBusinessExpenses: Array<{
      daysFromWeekStart: number;
      amount: number;
      category: string;
      notes: string;
    }> = [
      {
        daysFromWeekStart: 2,
        amount: 45,
        category: 'Shipping',
        notes: `USPS prepaid labels — March shows ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 2,
        amount: 30,
        category: 'Software',
        notes: `Listing tool subscription ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 1,
        amount: 28,
        category: 'Shipping',
        notes: `Bubble mailers and tape ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 0,
        amount: 65,
        category: 'Supplies',
        notes: `Poly bags and tissue paper ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -1,
        amount: 49,
        category: 'Software',
        notes: `Cross-listing app monthly ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -3,
        amount: 120,
        category: 'Equipment',
        notes: `Ring light replacement ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -5,
        amount: 85,
        category: 'Supplies',
        notes: `Storage bins for garage inventory ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -7,
        amount: 40,
        category: 'Travel',
        notes: `Gas to pickup liquidation pallet ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -9,
        amount: 150,
        category: 'Other',
        notes: `Weekend market booth fee ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -12,
        amount: 62,
        category: 'Shipping',
        notes: `Label printer rolls ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -15,
        amount: 35,
        category: 'Supplies',
        notes: `Thank-you cards and stickers ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -18,
        amount: 89,
        category: 'Equipment',
        notes: `Scale batteries and packing tape gun ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -22,
        amount: 55,
        category: 'Other',
        notes: `Home internet — business portion ${SEED_MARKER}`,
      },
    ];

    for (const row of seedBusinessExpenses) {
      await client.query(
        `INSERT INTO business_expenses (expense_date, amount, category, notes)
         VALUES ($1, $2, $3, $4)`,
        [
          formatYmdLocal(addDaysLocal(weekStart, row.daysFromWeekStart)),
          row.amount,
          row.category,
          row.notes,
        ]
      );
    }

    // Inventory purchases — reinvestment outflows (8–15 rows, multiple suppliers and types)
    const seedInventoryPurchases: Array<{
      daysFromWeekStart: number;
      amount: number;
      supplier: string;
      category: string;
      purchase_type: string;
      notes: string;
    }> = [
      {
        daysFromWeekStart: 2,
        amount: 200,
        supplier: `Local Thrift Chain ${SEED_MARKER}`,
        category: 'Mixed',
        purchase_type: 'Shelf Pulls',
        notes: `Show restock — Nike and Lululemon mix ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 2,
        amount: 1850,
        supplier: `Liquidation Direct ${SEED_MARKER}`,
        category: 'Mixed',
        purchase_type: 'Pallet',
        notes: `Spring clothing pallet — ~180 units ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 1,
        amount: 320,
        supplier: `Local Thrift Chain ${SEED_MARKER}`,
        category: 'Clothing',
        purchase_type: 'Shelf Pulls',
        notes: `Designer denim lot ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: 0,
        amount: 2400,
        supplier: `B-Stock Outlet ${SEED_MARKER}`,
        category: 'Clothing',
        purchase_type: 'Pallet',
        notes: `Customer returns pallet — apparel ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -2,
        amount: 175,
        supplier: `Mercari bulk seller ${SEED_MARKER}`,
        category: 'Accessories',
        purchase_type: 'Other',
        notes: `Handbag and belt bundle ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -4,
        amount: 890,
        supplier: `Amazon Returns Lot ${SEED_MARKER}`,
        category: 'Mixed',
        purchase_type: 'Returned Merchandise',
        notes: `Small appliance and home goods box lot ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -6,
        amount: 450,
        supplier: `Liquidation Direct ${SEED_MARKER}`,
        category: 'Shoes',
        purchase_type: 'Liquidation',
        notes: `Athletic shoes — 40 pairs ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -8,
        amount: 125,
        supplier: `Seed Mom Inventory ${SEED_MARKER}`,
        category: 'Mixed',
        purchase_type: 'Consignment',
        notes: `Mom consignment drop — vintage ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -10,
        amount: 680,
        supplier: `B-Stock Outlet ${SEED_MARKER}`,
        category: 'Clothing',
        purchase_type: 'Shelf Pulls',
        notes: `Off-season coats and jackets ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -13,
        amount: 2100,
        supplier: `Direct Liquidation Co ${SEED_MARKER}`,
        category: 'Mixed',
        purchase_type: 'Pallet',
        notes: `General merchandise pallet #447 ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -16,
        amount: 95,
        supplier: `FB Marketplace pickup ${SEED_MARKER}`,
        category: 'Accessories',
        purchase_type: 'Other',
        notes: `Jewelry and sunglasses lot ${SEED_MARKER}`,
      },
      {
        daysFromWeekStart: -20,
        amount: 540,
        supplier: `Local Thrift Chain ${SEED_MARKER}`,
        category: 'Shoes',
        purchase_type: 'Shelf Pulls',
        notes: `Boots and sneakers restock ${SEED_MARKER}`,
      },
    ];

    for (const row of seedInventoryPurchases) {
      await client.query(
        `INSERT INTO inventory_purchases (purchase_date, amount, supplier, category, purchase_type, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          formatYmdLocal(addDaysLocal(weekStart, row.daysFromWeekStart)),
          row.amount,
          row.supplier,
          row.category,
          row.purchase_type,
          row.notes,
        ]
      );
    }

    // Cash snapshot anchor — one week before current week so later events move recommendations
    await client.query(
      `INSERT INTO cash_snapshots (snapshot_date, amount, source, notes)
       VALUES ($1, 10000, 'MANUAL', $2)`,
      [snapshotDate, `Baseline before this week activity ${SEED_MARKER}`]
    );

    // Financial strategy — global settings for recommendations
    await client.query(
      `INSERT INTO financial_strategy_settings (
         scope_key, strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount
       ) VALUES ('global', 'BALANCED', 3000, 5000, 2000)
       ON CONFLICT (scope_key) DO UPDATE SET
         strategy_type = EXCLUDED.strategy_type,
         tax_reserve_bps = EXCLUDED.tax_reserve_bps,
         reinvestment_bps = EXCLUDED.reinvestment_bps,
         cash_buffer_amount = EXCLUDED.cash_buffer_amount,
         updated_at = NOW()`
    );

    // Owner draw for current week — owner payout page
    await client.query(
      `INSERT INTO owner_self_pay_transactions (
         account_id, account_type, amount, week_start_date, week_end_date,
         paid_at, transaction_type, reference, note, created_by
       ) VALUES (
         $1, 'OWNER', 250, $2, $3,
         $4::timestamptz, 'OWNER_DRAW', $5, $6, $7
       )`,
      [
        ownerAccountId,
        formatYmdLocal(weekStart),
        formatYmdLocal(weekEnd),
        `${activityDate}T12:00:00.000Z`,
        SEED_OWNER_DRAW_REFERENCE,
        `Seed owner draw ${SEED_MARKER}`,
        userId,
      ]
    );

    await client.query('COMMIT');
    console.log(
      'Domain seed complete: 3 wholesalers, 3 shows (ACTIVE + COMPLETED + PLANNED), settlements, vendor expense, payments, 13 business expenses, 12 inventory purchases, cash snapshot, strategy, owner draw.'
    );
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }

  // Backfill matches prod behavior for historical rows; idempotent via source checks + seed event cleanup above.
  const { getPool } = await import('../src/db');
  const pool = getPool();
  try {
    const report = await runFinancialEventsBackfill(pool, { dryRun: false });
    console.log('');
    console.log('Financial events backfill complete');
    console.log(
      `Inserted: ${report.totalInserted}  Skipped: ${report.totalSkipped}  Errors: ${report.totalErrors}`
    );
    for (const table of report.tables) {
      if (table.scanned > 0) {
        console.log(
          `  ${table.table}: scanned=${table.scanned} inserted=${table.inserted} skipped=${table.skipped} errors=${table.errors}`
        );
      }
    }
    if (report.totalErrors > 0) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
