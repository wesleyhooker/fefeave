/**
 * Show settlement + wholesaler ledger integration tests.
 * Flow: create show -> add financials -> create settlement (percent) -> create payment -> balances + statement.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import { execSync } from 'child_process';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { buildAppForTest, buildUniqueDevBypassIdentity } from './helpers';

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

describe('Settlement and ledger integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = '/api';

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('settlement-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('full flow: show -> financials -> percent settlement -> payment -> balances and statement', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-08-01',
        platform: 'WHATNOT',
        name: 'August Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: {
        payout_after_fees_amount: 10000,
        gross_sales_amount: 12500,
      },
    });
    expect(finRes.statusCode).toBe(200);
    const financials = JSON.parse(finRes.payload);
    expect(Number(financials.payout_after_fees_amount)).toBe(10000);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Settlement Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 25,
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);
    expect(settlement.calculation_method).toBe('PERCENT_PAYOUT');
    expect(Number(settlement.amount)).toBe(2500);
    expect(Number(settlement.base_amount)).toBe(10000);
    expect(settlement.rate_bps).toBe(2500);

    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 1000,
        payment_date: '2025-08-15',
        reference: 'CHK-001',
      },
    });
    expect(paymentRes.statusCode).toBe(201);

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload);
    const bal = balances.find((b: { wholesaler_id: string }) => b.wholesaler_id === wholesaler.id);
    expect(bal).toBeDefined();
    expect(Number(bal.owed_total)).toBe(2500);
    expect(Number(bal.paid_total)).toBe(1000);
    expect(Number(bal.balance_owed)).toBe(1500);
    expect(new Date(bal.last_payment_date).toISOString().slice(0, 10)).toBe('2025-08-15');

    const statementRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/${wholesaler.id}/statement`,
    });
    expect(statementRes.statusCode).toBe(200);
    const statement = JSON.parse(statementRes.payload);
    expect(statement.length).toBeGreaterThanOrEqual(2);
    const owedEntry = statement.find((e: { type: string }) => e.type === 'OWED');
    const paymentEntry = statement.find((e: { type: string }) => e.type === 'PAYMENT');
    expect(owedEntry).toBeDefined();
    expect(Number(owedEntry.amount)).toBe(2500);
    expect(owedEntry.show_id).toBe(show.id);
    expect(paymentEntry).toBeDefined();
    expect(Number(paymentEntry.amount)).toBe(1000);
  });

  test('POST percent settlement without show financials returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-09-01',
        platform: 'WHATNOT',
        name: 'Show Without Financials',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Another Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'PERCENT_PAYOUT',
        rate_percent: 10,
      },
    });
    expect(settlementRes.statusCode).toBe(409);
    const body = JSON.parse(settlementRes.payload);
    expect(body.message).toMatch(/financials not found|add financials/i);
  });

  test('ITEMIZED settlement: creates one owed_line_items row, settlement_lines, amount = sum(line_total_cents)/100', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-01',
        platform: 'WHATNOT',
        name: 'October Itemized Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Itemized Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        lines: [
          { itemName: 'New Balance 550', quantity: 6, unitPrice: 6000 },
          { itemName: 'Crewneck', quantity: 3, unitPrice: 2500 },
        ],
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);
    expect(settlement.id).toBeDefined();
    expect(settlement.calculation_method).toBe('ITEMIZED');
    expect(settlement.show_id).toBe(show.id);
    expect(settlement.wholesaler_id).toBe(wholesaler.id);

    const expectedTotalCents = 6 * 6000 + 3 * 2500; // 36000 + 7500 = 43500
    const expectedAmountDollars = expectedTotalCents / 100; // 435.00
    expect(Number(settlement.amount)).toBe(expectedAmountDollars);

    expect(Array.isArray(settlement.lines)).toBe(true);
    expect(settlement.lines).toHaveLength(2);
    const line1 = settlement.lines.find(
      (l: { item_name: string }) => l.item_name === 'New Balance 550'
    );
    const line2 = settlement.lines.find((l: { item_name: string }) => l.item_name === 'Crewneck');
    expect(line1).toBeDefined();
    expect(line1.quantity).toBe(6);
    expect(line1.unit_price_cents).toBe(6000);
    expect(line1.line_total_cents).toBe(36000);
    expect(line2).toBeDefined();
    expect(line2.quantity).toBe(3);
    expect(line2.unit_price_cents).toBe(2500);
    expect(line2.line_total_cents).toBe(7500);

    const sumLineTotals = settlement.lines.reduce(
      (s: number, l: { line_total_cents: number }) => s + l.line_total_cents,
      0
    );
    expect(sumLineTotals).toBe(expectedTotalCents);
    expect(Number(settlement.amount)).toBe(sumLineTotals / 100);
  });

  test('GET /shows/:showId/settlements returns lines for ITEMIZED settlements', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-02',
        platform: 'WHATNOT',
        name: 'Show For GET Lines',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'GET Lines Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        lines: [{ itemName: 'Single Item', quantity: 2, unitPrice: 1000 }],
      },
    });

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${show.id}/settlements`,
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload);
    expect(Array.isArray(list)).toBe(true);
    const itemized = list.find(
      (s: { calculation_method: string }) => s.calculation_method === 'ITEMIZED'
    );
    expect(itemized).toBeDefined();
    expect(Number(itemized.amount)).toBe(20); // 2 * 1000 cents = 2000 cents = 20 dollars
    expect(Array.isArray(itemized.lines)).toBe(true);
    expect(itemized.lines).toHaveLength(1);
    expect(itemized.lines[0].item_name).toBe('Single Item');
    expect(itemized.lines[0].quantity).toBe(2);
    expect(itemized.lines[0].unit_price_cents).toBe(1000);
    expect(itemized.lines[0].line_total_cents).toBe(2000);
  });

  test('balances include ITEMIZED settlement total correctly', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-03',
        platform: 'WHATNOT',
        name: 'Show For Balances',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Balances Itemized Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'ITEMIZED',
        lines: [
          { itemName: 'A', quantity: 1, unitPrice: 10000 },
          { itemName: 'B', quantity: 2, unitPrice: 2500 },
        ],
      },
    });
    // 10000 + 5000 = 15000 cents = 150.00
    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload);
    const bal = balances.find((b: { wholesaler_id: string }) => b.wholesaler_id === wholesaler.id);
    expect(bal).toBeDefined();
    expect(Number(bal.owed_total)).toBe(150);
    expect(Number(bal.balance_owed)).toBe(150);
  });

  test('MANUAL settlement still works and appears in balances', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-10-04',
        platform: 'WHATNOT',
        name: 'Show For Manual',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Manual Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: {
        wholesaler_id: wholesaler.id,
        method: 'MANUAL',
        amount: 999.99,
      },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);
    expect(settlement.calculation_method).toBe('MANUAL');
    expect(Number(settlement.amount)).toBe(999.99);
    expect(settlement.lines).toBeUndefined();

    const balancesRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers/balances`,
    });
    expect(balancesRes.statusCode).toBe(200);
    const balances = JSON.parse(balancesRes.payload);
    const bal = balances.find((b: { wholesaler_id: string }) => b.wholesaler_id === wholesaler.id);
    expect(bal).toBeDefined();
    expect(Number(bal.owed_total)).toBe(999.99);
    expect(Number(bal.balance_owed)).toBe(999.99);
  });
});
