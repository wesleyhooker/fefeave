/**
 * Strategy allocation entries + ledger dual-write integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { STRATEGY_ALLOCATION_SOURCE_TYPE } from '../constants/strategy-allocation';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

type FinancialEventRow = {
  event_type: string;
  direction: string | null;
  amount: string | null;
  source_type: string | null;
  source_id: string | null;
  payload: Record<string, unknown>;
};

describe('Strategy allocation integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = '/api';

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runTestSchemaMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('strategy-alloc-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;

    const pool = getPool();
    await pool.query('DELETE FROM financial_events');
    await pool.query('DELETE FROM strategy_allocation_entries');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function eventsForSource(
    sourceType: string,
    sourceId: string
  ): Promise<FinancialEventRow[]> {
    const result = await getPool().query(
      `SELECT event_type, direction, amount, source_type, source_id, payload
       FROM financial_events
       WHERE source_type = $1 AND source_id = $2
       ORDER BY occurred_at ASC, id ASC`,
      [sourceType, sourceId]
    );
    return result.rows as FinancialEventRow[];
  }

  test('GET period-allocations returns null targets and zero recorded', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-06-02/period-allocations`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.weekStartDate).toBe('2026-06-02');
    expect(body.weekEndDate).toBe('2026-06-08');
    expect(body.taxSetAside).toEqual({ target: null, recorded: '0.00' });
    expect(body.reinvestmentSetAside).toEqual({ target: null, recorded: '0.00' });
    expect(body.entries).toEqual([]);
  });

  test('POST allocation records tax set-aside and dual-writes TAX_SET_ASIDE_RECORDED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: {
        allocation_type: 'TAX_SET_ASIDE',
        amount: 100,
        note: 'Q2 estimated tax',
      },
    });
    expect(res.statusCode).toBe(201);
    const entry = JSON.parse(res.payload);
    expect(entry.allocationType).toBe('TAX_SET_ASIDE');
    expect(entry.amount).toBe('100.00');
    expect(entry.periodWeekStart).toBe('2026-06-02');

    const events = await eventsForSource(STRATEGY_ALLOCATION_SOURCE_TYPE, entry.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe('TAX_SET_ASIDE_RECORDED');
    expect(events[0].direction).toBe('NEUTRAL');
    expect(Number(events[0].amount)).toBe(100);
    expect(events[0].payload).toMatchObject({
      allocation_type: 'TAX_SET_ASIDE',
      period_week_start: '2026-06-02',
      period_week_end: '2026-06-08',
    });

    const summary = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-06-02/period-allocations`,
    });
    const summaryBody = JSON.parse(summary.payload);
    expect(summaryBody.taxSetAside.recorded).toBe('100.00');
    expect(summaryBody.entries).toHaveLength(1);
  });

  test('POST multiple reinvestment entries sum recorded', async () => {
    const first = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'REINVESTMENT_SET_ASIDE', amount: 50 },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'REINVESTMENT_SET_ASIDE', amount: 75.25 },
    });
    expect(second.statusCode).toBe(201);

    const summary = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-06-02/period-allocations`,
    });
    const body = JSON.parse(summary.payload);
    expect(body.reinvestmentSetAside.recorded).toBe('125.25');
    expect(body.entries).toHaveLength(2);
  });

  test('DELETE voids entry and writes REINVESTMENT_SET_ASIDE_VOIDED', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'REINVESTMENT_SET_ASIDE', amount: 40 },
    });
    const entry = JSON.parse(create.payload);

    const del = await app.inject({
      method: 'DELETE',
      url: `${prefix}/strategy-allocation-entries/${entry.id}`,
    });
    expect(del.statusCode).toBe(204);

    const events = await eventsForSource(STRATEGY_ALLOCATION_SOURCE_TYPE, entry.id);
    expect(events).toHaveLength(2);
    expect(events[1].event_type).toBe('REINVESTMENT_SET_ASIDE_VOIDED');
    expect(events[1].direction).toBe('NEUTRAL');

    const summary = await app.inject({
      method: 'GET',
      url: `${prefix}/owner-self-pay/2026-06-02/period-allocations`,
    });
    const body = JSON.parse(summary.payload);
    expect(body.reinvestmentSetAside.recorded).toBe('0.00');
    expect(body.entries).toHaveLength(0);
  });

  test('rejects invalid allocation_type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'OWNER_PAYOUT', amount: 10 },
    });
    expect(res.statusCode).toBe(400);
  });
});
