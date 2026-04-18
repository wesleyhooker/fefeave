/**
 * Balances CSV export integration tests: GET /api/exports/balances.csv.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';

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

describe('Balances CSV export integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  let databaseUrl = '';
  const prefix = '/api';

  beforeAll(() => {
    databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      // eslint-disable-next-line no-console
      console.warn(
        'Skipping balances CSV integration tests: DATABASE_URL is required. Run: npm run test:integration'
      );
      return;
    }
    runMigrations(databaseUrl);
  });

  beforeEach(async () => {
    if (!databaseUrl) return;
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-exports-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    restoreEnv?.();
    if (app) await app.close();
  });

  function parseCsvLines(payload: string): string[] {
    return payload
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
  }

  test('GET /api/exports/balances.csv returns CSV with required headers and BOM', async () => {
    if (!databaseUrl) return;

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment; filename="balances-');
    expect(res.payload.startsWith('\uFEFF')).toBe(true);

    const [firstLine] = parseCsvLines(res.payload);
    expect(firstLine).toBe('Wholesaler,Owed Total,Paid Total,Balance Owed,Last Payment Date');
  });

  test('GET /api/exports/balances.csv applies owingOnly and sort by name asc', async () => {
    if (!databaseUrl) return;

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-01',
        platform: 'WHATNOT',
        name: 'CSV Export Test Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const financialsRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 10000,
        gross_sales_amount: 12000,
      },
    });
    expect(financialsRes.statusCode).toBe(200);

    const wholesalerBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Zulu Wholesaler' },
    });
    expect(wholesalerBRes.statusCode).toBe(201);
    const wholesalerB = JSON.parse(wholesalerBRes.payload);

    const wholesalerARes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Alpha Wholesaler' },
    });
    expect(wholesalerARes.statusCode).toBe(201);
    const wholesalerA = JSON.parse(wholesalerARes.payload);

    const settlementBRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerB.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 20,
      },
    });
    expect(settlementBRes.statusCode).toBe(201);

    const settlementARes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesalerA.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 10,
      },
    });
    expect(settlementARes.statusCode).toBe(201);

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv?sortKey=name&sortDir=asc&owingOnly=true`,
    });
    expect(exportRes.statusCode).toBe(200);

    const lines = parseCsvLines(exportRes.payload);

    expect(lines[0]).toBe('Wholesaler,Owed Total,Paid Total,Balance Owed,Last Payment Date');
    expect(lines.length).toBeGreaterThanOrEqual(3);

    const namesAsc = lines
      .slice(1)
      .map((line) => line.split(',')[0])
      .filter((name) => name === 'Alpha Wholesaler' || name === 'Zulu Wholesaler');
    expect(namesAsc).toEqual(['Alpha Wholesaler', 'Zulu Wholesaler']);
  });

  test('balances endpoint and balances.csv return consistent numeric values', async () => {
    if (!databaseUrl) return;

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload) as Array<{
      name: string;
      owed_total: string;
      paid_total: string;
      balance_owed: string;
    }>;

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv`,
    });
    expect(exportRes.statusCode).toBe(200);

    const lines = parseCsvLines(exportRes.payload);
    const dataLines = lines.slice(1);
    const csvByName = new Map<string, { owed: number; paid: number; balance: number }>();
    for (const line of dataLines) {
      const [name, owed, paid, balance] = line.split(',');
      csvByName.set(name, {
        owed: Number(owed),
        paid: Number(paid),
        balance: Number(balance),
      });
    }

    for (const row of balances) {
      const csvRow = csvByName.get(row.name);
      expect(csvRow).toBeDefined();
      if (!csvRow) continue;
      expect(csvRow.owed).toBeCloseTo(Number(row.owed_total), 2);
      expect(csvRow.paid).toBeCloseTo(Number(row.paid_total), 2);
      expect(csvRow.balance).toBeCloseTo(Number(row.balance_owed), 2);
    }
  });

  test('balances endpoint ordering matches balances.csv when using name-asc view semantics', async () => {
    if (!databaseUrl) return;

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload) as Array<{ name: string }>;
    const jsonOrder = balances.map((r) => r.name);

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv?sortKey=name&sortDir=asc`,
    });
    expect(exportRes.statusCode).toBe(200);
    const lines = parseCsvLines(exportRes.payload);
    const csvOrder = lines.slice(1).map((line) => line.split(',')[0]);

    expect(csvOrder).toEqual(jsonOrder);
  });

  test('balances.csv normalizes monetary values to 2 decimal places', async () => {
    if (!databaseUrl) return;

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-11-01',
        platform: 'WHATNOT',
        name: 'Decimal Formatting Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload) as { id: string };

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Decimal Format Vendor' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload) as { id: string };

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'MANUAL',
        amount: 1234.5,
      },
    });
    expect(settlementRes.statusCode).toBe(201);

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 200,
        payment_date: '2025-11-02',
      },
    });
    expect(paymentRes.statusCode).toBe(201);

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/balances.csv?search=${encodeURIComponent('Decimal Format Vendor')}`,
    });
    expect(exportRes.statusCode).toBe(200);

    const lines = parseCsvLines(exportRes.payload);
    expect(lines.length).toBe(2);
    const row = lines[1].split(',');
    expect(row[1]).toMatch(/^-?\d+\.\d{2}$/);
    expect(row[2]).toMatch(/^-?\d+\.\d{2}$/);
    expect(row[3]).toMatch(/^-?\d+\.\d{2}$/);
    expect(row[1]).toBe('1234.50');
    expect(row[2]).toBe('200.00');
    expect(row[3]).toBe('1034.50');
  });

  test('ledger.csv returns expected headers and deterministic ordering', async () => {
    if (!databaseUrl) return;

    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-12-01',
        platform: 'WHATNOT',
        name: 'Ledger Export Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload) as { id: string };

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Ledger Sort Vendor' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload) as { id: string; name: string };

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'MANUAL',
        amount: 100,
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload) as { id: string };

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 25,
        payment_date: '2099-01-02',
        reference: 'PAY-REF-001',
      },
    });
    expect(paymentRes.statusCode).toBe(201);
    const payment = JSON.parse(paymentRes.payload) as { id: string };

    const exportRes = await app.inject({
      method: 'GET',
      url: `${prefix}/exports/ledger.csv?wholesalerId=${wholesaler.id}`,
    });
    expect(exportRes.statusCode).toBe(200);

    const lines = parseCsvLines(exportRes.payload);
    expect(lines[0]).toBe('Date,Wholesaler,Type,Show,Reference ID,Description,Amount');
    expect(lines.length).toBeGreaterThanOrEqual(3);

    const entries = lines.slice(1).map((line) => {
      const [date, wholesalerName, type, showName, referenceId, description, amount] =
        line.split(',');
      return { date, wholesalerName, type, showName, referenceId, description, amount };
    });

    expect(entries.some((e) => e.referenceId === settlement.id && e.type === 'OWED')).toBe(true);
    expect(entries.some((e) => e.referenceId === payment.id && e.type === 'PAYMENT')).toBe(true);

    const sorted = [...entries].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const aTypeOrder = a.type === 'OWED' ? 0 : 1;
      const bTypeOrder = b.type === 'OWED' ? 0 : 1;
      if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;
      return a.referenceId.localeCompare(b.referenceId);
    });
    expect(entries).toEqual(sorted);

    const owedEntry = entries.find((e) => e.referenceId === settlement.id);
    const paymentEntry = entries.find((e) => e.referenceId === payment.id);
    expect(owedEntry?.wholesalerName).toBe(wholesaler.name);
    expect(owedEntry?.amount).toBe('100.00');
    expect(paymentEntry?.amount).toBe('-25.00');
  });
});
