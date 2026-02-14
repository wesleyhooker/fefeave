/**
 * DB smoke test: runs migrations and verifies basic CRUD.
 * Requires Postgres running and DATABASE_URL set.
 * Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import { Pool } from 'pg';

const TEST_SCHEMA = 'test';

function runMigrations(databaseUrl: string): void {
  execSync(
    `npx node-pg-migrate up -m migrations -s ${TEST_SCHEMA} --create-schema --create-migrations-schema`,
    {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
    }
  );
}

describe('DB smoke test', () => {
  let pool: Pool;
  let databaseUrl: string;

  beforeAll(async () => {
    databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for DB smoke test. Run: npm run test:integration');
    }
    pool = new Pool({ connectionString: databaseUrl });
  });

  it('runs migrate:up and inserts wholesaler, show, owed_line_item', async () => {
    runMigrations(databaseUrl);

    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${TEST_SCHEMA}`);

      const userRes = await client.query(
        `INSERT INTO users (cognito_user_id, email, role) VALUES ($1, $2, $3) RETURNING id`,
        ['test-cognito-sub', 'test@example.com', 'OPERATOR']
      );
      const userId = userRes.rows[0].id;

      const wholesalerRes = await client.query(
        `INSERT INTO wholesalers (name) VALUES ($1) RETURNING id, name`,
        ['Test Wholesaler']
      );
      const wholesaler = wholesalerRes.rows[0];
      expect(wholesaler.name).toBe('Test Wholesaler');

      const showRes = await client.query(
        `INSERT INTO shows (name, show_date, created_by) VALUES ($1, $2, $3) RETURNING id, name, show_date`,
        ['Test Show', '2025-03-15', userId]
      );
      const show = showRes.rows[0];
      expect(show.name).toBe('Test Show');
      expect(show.show_date).toBe('2025-03-15');

      const lineItemRes = await client.query(
        `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, amount, description`,
        [show.id, wholesaler.id, '1250.50', 'Booth rental', userId]
      );
      const lineItem = lineItemRes.rows[0];
      expect(lineItem.amount).toBe('1250.50');
      expect(lineItem.description).toBe('Booth rental');

      const readWholesaler = await client.query(`SELECT id, name FROM wholesalers WHERE id = $1`, [
        wholesaler.id,
      ]);
      expect(readWholesaler.rows[0].name).toBe('Test Wholesaler');

      const readShow = await client.query(`SELECT id, name, show_date FROM shows WHERE id = $1`, [
        show.id,
      ]);
      expect(readShow.rows[0].name).toBe('Test Show');

      const readLineItem = await client.query(
        `SELECT id, amount, description FROM owed_line_items WHERE id = $1`,
        [lineItem.id]
      );
      expect(readLineItem.rows[0].amount).toBe('1250.50');
      expect(readLineItem.rows[0].description).toBe('Booth rental');
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    if (!pool) return;
    try {
      const client = await pool.connect();
      try {
        await client.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  });
});
