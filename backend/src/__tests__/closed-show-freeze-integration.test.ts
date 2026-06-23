/**
 * Closed show freeze integration tests.
 * When show.status === 'COMPLETED', financials and settlements cannot be modified.
 * Reopen (PATCH status to ACTIVE) allows edits again.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

const CLOSED_MESSAGE = 'Show is closed; reopen before editing.';

describe('Closed show freeze', () => {
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
    const identity = buildUniqueDevBypassIdentity('freeze-admin', 'ADMIN');
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

  test('when show is COMPLETED, POST financials returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-01', platform: 'WHATNOT', name: 'Freeze Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 5000 },
    });

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 6000 },
    });
    expect(finRes.statusCode).toBe(409);
    const body = JSON.parse(finRes.payload);
    expect(body.message).toBe(CLOSED_MESSAGE);
  });

  test('when show is COMPLETED, POST settlement returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-02', platform: 'WHATNOT', name: 'Freeze Show 2' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 8000 },
    });

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Freeze Wholesaler' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'PERCENT_PAYOUT', rate_percent: 20 },
    });

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 500 },
    });
    expect(settlementRes.statusCode).toBe(409);
    const body = JSON.parse(settlementRes.payload);
    expect(body.message).toBe(CLOSED_MESSAGE);
  });

  test('when show is COMPLETED, DELETE settlement returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-03', platform: 'WHATNOT', name: 'Freeze Show 3' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 3000 },
    });

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Freeze W2' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
    });
    expect(delRes.statusCode).toBe(409);
    const body = JSON.parse(delRes.payload);
    expect(body.message).toBe(CLOSED_MESSAGE);
  });

  test('when show is COMPLETED, PATCH settlement returns 409', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-03b', platform: 'WHATNOT', name: 'Freeze Show PATCH' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 3000 },
    });

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Freeze W PATCH' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 100 },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 120 },
    });
    expect(patchRes.statusCode).toBe(409);
    const body = JSON.parse(patchRes.payload);
    expect(body.message).toBe(CLOSED_MESSAGE);
  });

  test('after reopening (ACTIVE), financials and settlements can be modified', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-04', platform: 'WHATNOT', name: 'Reopen Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 4000 },
    });

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Reopen W' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);
    const secondWholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'Reopen W2' },
    });
    expect(secondWholesalerRes.statusCode).toBe(201);
    const secondWholesaler = JSON.parse(secondWholesalerRes.payload);

    const settlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: wholesaler.id, method: 'MANUAL', amount: 200 },
    });
    expect(settlementRes.statusCode).toBe(201);
    const settlement = JSON.parse(settlementRes.payload);

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const reopenRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'ACTIVE' },
    });
    expect(reopenRes.statusCode).toBe(200);

    const finRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 4500 },
    });
    expect(finRes.statusCode).toBe(200);

    const secondSettlementRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/settlements`,
      payload: { wholesaler_id: secondWholesaler.id, method: 'MANUAL', amount: 100 },
    });
    expect(secondSettlementRes.statusCode).toBe(201);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${show.id}/settlements/${settlement.id}`,
    });
    expect(delRes.statusCode).toBe(200);
  });

  test('PATCH COMPLETED without financials returns 400', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-03', platform: 'WHATNOT', name: 'No Payout Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(400);
    const body = JSON.parse(closeRes.payload);
    expect(body.message).toMatch(/payout after fees/i);
  });

  test('PATCH COMPLETED with zero payout returns 400', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-04', platform: 'WHATNOT', name: 'Zero Payout Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 0 },
    });

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(400);
  });

  test('PATCH COMPLETED with payout and no settlements succeeds', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-10-05', platform: 'WHATNOT', name: 'Payout Only Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 1200 },
    });

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);
  });
});
