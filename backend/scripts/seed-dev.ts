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
const SEED_SHOW_NAMES = ['Seed Show Active', 'Seed Show Closed'] as const;

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

    // --- 4) Insert seed shows (ACTIVE + COMPLETED) with financials and settlements ---
    const show1 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show Active', '2025-03-01', 'WHATNOT', 'WHATNOT', 'ACTIVE', $1, 'API') RETURNING id`,
      [userId]
    );
    const show1Id = show1.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, payout_after_fees_amount, currency) VALUES ($1, 1000, 'USD')`,
      [show1Id]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, 200, 'USD', 'Settlement 20%', 'PENDING', $3, 'API', 'PERCENT_PAYOUT', 2000, 1000)`,
      [show1Id, wid1, userId]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, 100, 'USD', 'Settlement fixed', 'PENDING', $3, 'API', 'MANUAL', NULL, NULL)`,
      [show1Id, wid2, userId]
    );

    const show2 = await client.query(
      `INSERT INTO shows (name, show_date, platform, source, status, created_by, created_via)
       VALUES ('Seed Show Closed', '2025-02-15', 'WHATNOT', 'WHATNOT', 'COMPLETED', $1, 'API') RETURNING id`,
      [userId]
    );
    const show2Id = show2.rows[0].id as string;
    await client.query(
      `INSERT INTO show_financials (show_id, payout_after_fees_amount, currency) VALUES ($1, 500, 'USD')`,
      [show2Id]
    );
    await client.query(
      `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
       VALUES ($1, $2, 150, 'USD', 'Settlement W3', 'PENDING', $3, 'API', 'MANUAL', NULL, NULL)`,
      [show2Id, wid3, userId]
    );

    // --- 5) Insert payments (partial + full; W3 has none so "Last payment: —") ---
    const today = new Date().toISOString().slice(0, 10);
    await client.query(
      `INSERT INTO payments (wholesaler_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, 50, 'USD', $2, 'CASH', 'seed-partial', 'Seed partial payment', $3, 'API')`,
      [wid1, today, userId]
    );
    await client.query(
      `INSERT INTO payments (wholesaler_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
       VALUES ($1, 100, 'USD', $2, 'CASH', 'seed-full', 'Seed full payment', $3, 'API')`,
      [wid2, today, userId]
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
