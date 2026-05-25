/**
 * Dev-only seed: idempotent "delete seed namespace then insert".
 * Uses deterministic names so we only ever delete/insert our own seed data.
 * Never touches prod; safe to run repeatedly (make dev-seed).
 *
 * Usage: DATABASE_URL=... npx tsx scripts/seed-dev.ts
 * Or: make dev-seed (uses LOCAL_DB_URL if DATABASE_URL unset)
 */

import { Client } from 'pg';

const SEED_USER_COGNITO_ID = 'seed-dev-user';
const SEED_USER_EMAIL = 'local@fefeave.local';
const SEED_USER_ROLE = 'ADMIN';

// Deterministic names for "seed namespace" (delete only these)
const SEED_WHOLESALER_NAMES = [
  'Seed Wholesaler A (ASAP)',
  'Seed Wholesaler B (batch)',
  'Seed Mom Inventory',
] as const;
const SEED_SHOW_NAMES = ['Seed Show This Week Active', 'Seed Show This Week Closed'] as const;

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

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    // --- 1) Ensure seed user (idempotent upsert by email so reruns never hit users_email_key) ---
    const userRes = await client.query(
      `INSERT INTO users (cognito_user_id, email, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET cognito_user_id = EXCLUDED.cognito_user_id, role = EXCLUDED.role, updated_at = NOW()
       RETURNING id`,
      [SEED_USER_COGNITO_ID, SEED_USER_EMAIL, SEED_USER_ROLE]
    );
    const userId = userRes.rows[0].id as string;
    await client.query(
      `INSERT INTO accounts (display_name, type, status, linked_user_id, notes)
       VALUES ('Felicia', 'OWNER', 'ACTIVE', $1, 'Default owner account')
       ON CONFLICT (type) WHERE (type = 'OWNER'::account_type)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         status = EXCLUDED.status,
         linked_user_id = EXCLUDED.linked_user_id,
         notes = EXCLUDED.notes,
         updated_at = NOW()`,
      [userId]
    );

    // --- 2) Delete seed namespace only (order respects FKs) ---
    // Remove seed payments by reference first (handles orphans if wholesalers were deleted earlier)
    await client.query(`DELETE FROM payments WHERE reference IN ('seed-partial', 'seed-full')`);

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
      // Remove mapped accounts before wholesalers so reruns do not leave legacy=NULL shells that bypass ON CONFLICT.
      await client.query(`DELETE FROM accounts WHERE legacy_wholesaler_id = ANY($1::uuid[])`, [
        idsW,
      ]);
      await client.query(`DELETE FROM wholesalers WHERE id = ANY($1::uuid[])`, [idsW]);
    }

    // --- 3) Insert seed wholesalers (all AD_HOC; variability in notes) ---
    const w1 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Wholesaler A (ASAP)', 'Usually paid next day. (seed-dev)']
    );
    const w2 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Wholesaler B (batch)', 'Usually paid in batches every 2 weeks. (seed-dev)']
    );
    const w3 = await client.query(
      `INSERT INTO wholesalers (name, notes, pay_schedule)
       VALUES ($1, $2, 'AD_HOC') RETURNING id`,
      ['Seed Mom Inventory', 'Mom inventory; track like any wholesaler. (seed-dev)']
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
      ['Seed Wholesaler A (ASAP)', 'Usually paid next day. (seed-dev)', wid1]
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
      ['Seed Wholesaler B (batch)', 'Usually paid in batches every 2 weeks. (seed-dev)', wid2]
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
      ['Seed Mom Inventory', 'Mom inventory; track like any wholesaler. (seed-dev)', wid3]
    );
    const aid1 = a1.rows[0].id as string;
    const aid2 = a2.rows[0].id as string;
    const aid3 = a3.rows[0].id as string;

    // --- 4) Insert seed shows (this-week ACTIVE + this-week COMPLETED) with financials/settlements ---
    const weekStart = startOfWeekMondayLocal();
    const activeShowDate = formatYmdLocal(addDaysLocal(weekStart, 3)); // Thursday
    const completedShowDate = formatYmdLocal(addDaysLocal(weekStart, 5)); // Saturday

    const show1 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show This Week Active', $1, 'WHATNOT', 'WHATNOT', 'ACTIVE', $2, 'API') RETURNING id`,
      [activeShowDate, userId]
    );
    const show1Id = show1.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, payout_after_fees_amount, currency) VALUES ($1, 1200, 'USD')`,
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

    const show2 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show This Week Closed', $1, 'WHATNOT', 'WHATNOT', 'COMPLETED', $2, 'API') RETURNING id`,
      [completedShowDate, userId]
    );
    const show2Id = show2.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, payout_after_fees_amount, currency) VALUES ($1, 1500, 'USD')`,
      [show2Id]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, account_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, $3, 300, 'USD', 'Settlement W3', 'PENDING', $4, 'API', 'MANUAL', NULL, NULL)`,
      [show2Id, wid3, aid3, userId]
    );

    // --- 5) Insert payments (partial + full; W3 has none so "Last payment: —") ---
    const today = new Date().toISOString().slice(0, 10);
    await client.query(
      `INSERT INTO payments (wholesaler_id, account_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, $2, 50, 'USD', $3, 'CASH', 'seed-partial', 'Seed partial payment', $4, 'API')`,
      [wid1, aid1, today, userId]
    );
    await client.query(
      `INSERT INTO payments (wholesaler_id, account_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, $2, 100, 'USD', $3, 'CASH', 'seed-full', 'Seed full payment', $4, 'API')`,
      [wid2, aid2, today, userId]
    );

    await client.query('COMMIT');
    console.log(
      'Seed complete (idempotent): 3 wholesalers, 2 shows (ACTIVE + COMPLETED), percent + fixed settlements, 2 payments. W3 has no payments (Last payment: —).'
    );
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
