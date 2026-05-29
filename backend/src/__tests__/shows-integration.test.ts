/**
 * Shows API integration tests: POST/GET /api/shows.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

function toYyyyMmDd(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

describe('Shows API integration', () => {
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
    const identity = buildUniqueDevBypassIdentity('shows-admin', 'ADMIN');
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

  test('POST /api/shows returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-03-15',
        platform: 'WHATNOT',
        name: 'Spring Show 2025',
        notes: 'Test notes',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(toYyyyMmDd(body.show_date)).toBe('2025-03-15');
    expect(body.platform).toBe('WHATNOT');
    expect(body.name).toBe('Spring Show 2025');
    expect(body.notes).toBe('Test notes');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET /api/shows includes created show', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-04-01',
        platform: 'INSTAGRAM',
        name: 'April Live',
      },
    });
    expect(postRes.statusCode).toBe(201);
    const created = JSON.parse(postRes.payload);

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows`,
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload);
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((s: { id: string }) => s.id === created.id);
    expect(found).toBeDefined();
    expect(toYyyyMmDd(found.show_date)).toBe('2025-04-01');
    expect(found.platform).toBe('INSTAGRAM');
    expect(found.name).toBe('April Live');
  });

  test('GET /api/shows/:id returns the show', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-05-10',
        platform: 'OTHER',
        name: 'Manual Show',
        external_reference: 'ext-123',
      },
    });
    expect(postRes.statusCode).toBe(201);
    const created = JSON.parse(postRes.payload);

    const getRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${created.id}`,
    });
    expect(getRes.statusCode).toBe(200);
    const show = JSON.parse(getRes.payload);
    expect(show.id).toBe(created.id);
    expect(toYyyyMmDd(show.show_date)).toBe('2025-05-10');
    expect(show.platform).toBe('OTHER'); // API normalizes MANUAL -> OTHER
    expect(show.name).toBe('Manual Show');
    expect(show.external_reference).toBe('ext-123');
    expect(show.status).toBeDefined();
  });

  describe('show duration (started_at / ended_at)', () => {
    test('POST accepts started_at/ended_at and GET returns them', async () => {
      const startedAt = '2025-07-01T18:00:00.000Z';
      const endedAt = '2025-07-01T20:30:00.000Z';
      const postRes = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: {
          show_date: '2025-07-01',
          platform: 'WHATNOT',
          name: 'Timed Show',
          started_at: startedAt,
          ended_at: endedAt,
        },
      });
      expect(postRes.statusCode).toBe(201);
      const created = JSON.parse(postRes.payload);
      expect(new Date(created.started_at).toISOString()).toBe(startedAt);
      expect(new Date(created.ended_at).toISOString()).toBe(endedAt);

      const getRes = await app.inject({
        method: 'GET',
        url: `${prefix}/shows/${created.id}`,
      });
      expect(getRes.statusCode).toBe(200);
      const show = JSON.parse(getRes.payload);
      expect(new Date(show.started_at).toISOString()).toBe(startedAt);
      expect(new Date(show.ended_at).toISOString()).toBe(endedAt);
    });

    test('POST is backward compatible when timestamps are omitted', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: { show_date: '2025-07-02', platform: 'WHATNOT', name: 'No Times' },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.started_at).toBeUndefined();
      expect(body.ended_at).toBeUndefined();
    });

    test('POST rejects ended_at before started_at (400)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: {
          show_date: '2025-07-03',
          platform: 'WHATNOT',
          name: 'Bad Times',
          started_at: '2025-07-03T20:00:00.000Z',
          ended_at: '2025-07-03T18:00:00.000Z',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('platform_fee_amount on financials', () => {
    async function createShowId(): Promise<string> {
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows`,
        payload: { show_date: '2025-07-10', platform: 'WHATNOT', name: 'Fee Show' },
      });
      return JSON.parse(res.payload).id as string;
    }

    test('POST financials accepts platform_fee_amount and GET returns it', async () => {
      const showId = await createShowId();
      const postRes = await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${showId}/financials`,
        payload: { payout_after_fees_amount: 1000, platform_fee_amount: 125.5 },
      });
      expect(postRes.statusCode).toBe(200);
      const fin = JSON.parse(postRes.payload);
      expect(Number(fin.platform_fee_amount)).toBe(125.5);

      const getRes = await app.inject({
        method: 'GET',
        url: `${prefix}/shows/${showId}/financials`,
      });
      expect(getRes.statusCode).toBe(200);
      expect(Number(JSON.parse(getRes.payload).platform_fee_amount)).toBe(125.5);
    });

    test('POST financials rejects negative platform_fee_amount (400)', async () => {
      const showId = await createShowId();
      const res = await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${showId}/financials`,
        payload: { payout_after_fees_amount: 1000, platform_fee_amount: -5 },
      });
      expect(res.statusCode).toBe(400);
    });

    test('platform_fee_amount is preserved on a payout-only re-upsert', async () => {
      const showId = await createShowId();
      await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${showId}/financials`,
        payload: { payout_after_fees_amount: 1000, platform_fee_amount: 80 },
      });
      // Re-upsert with payout only (mirrors the detail-view payout editor).
      const second = await app.inject({
        method: 'POST',
        url: `${prefix}/shows/${showId}/financials`,
        payload: { payout_after_fees_amount: 1200 },
      });
      expect(second.statusCode).toBe(200);
      const fin = JSON.parse(second.payload);
      expect(Number(fin.payout_after_fees_amount)).toBe(1200);
      expect(Number(fin.platform_fee_amount)).toBe(80);
    });
  });

  test('PATCH /api/shows/:id updates status to COMPLETED then ACTIVE', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2025-06-01', platform: 'WHATNOT', name: 'Close Test' },
    });
    expect(postRes.statusCode).toBe(201);
    const { id } = JSON.parse(postRes.payload);

    const patchClose = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(patchClose.statusCode).toBe(200);
    const closed = JSON.parse(patchClose.payload);
    expect(closed.status).toBe('COMPLETED');

    const patchReopen = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${id}`,
      payload: { status: 'ACTIVE' },
    });
    expect(patchReopen.statusCode).toBe(200);
    const reopened = JSON.parse(patchReopen.payload);
    expect(reopened.status).toBe('ACTIVE');
  });
});
