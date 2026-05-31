/**
 * Financial event writer integration tests.
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 *
 * Exercises appendFinancialEvent against a real financial_events table:
 * valid creation + round-trip, idempotency, required-field validation, and
 * payload/metadata jsonb persistence.
 */
import { getPool } from '../db';
import { appendFinancialEvent } from '../services/financial-events';
import { ValidationError } from '../utils/errors';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';
import type { FastifyInstance } from 'fastify';

describe('appendFinancialEvent integration', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;

  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required. Run: npm run test:integration');
    }
    runTestSchemaMigrations(databaseUrl);
  });

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('financial-events-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    await getPool().query('DELETE FROM financial_events');
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  test('creates a valid event and round-trips it from the table', async () => {
    const pool = getPool();
    const { event, created } = await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 120.5,
      effectiveDate: '2026-05-01',
      sourceType: 'business_expense',
      sourceId: '11111111-1111-1111-1111-111111111111',
      actorUserId: 'local-dev-user',
    });

    expect(created).toBe(true);
    expect(event.event_type).toBe('BUSINESS_EXPENSE_RECORDED');
    // Category and direction are derived from the catalog, not passed in.
    expect(event.event_category).toBe('FINANCIAL');
    expect(event.direction).toBe('OUTFLOW');
    expect(event.currency).toBe('USD');
    expect(event.event_version).toBe(1);
    expect(Number(event.amount)).toBe(120.5);
    expect(event.actor_user_id).toBe('local-dev-user');

    const stored = await pool.query(
      'SELECT event_type, event_category, direction, amount, currency, event_version, source_type, source_id FROM financial_events WHERE id = $1',
      [event.id]
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].event_category).toBe('FINANCIAL');
    expect(stored.rows[0].source_type).toBe('business_expense');
    expect(Number(stored.rows[0].amount)).toBe(120.5);
  });

  test('is idempotent for a repeated idempotency key', async () => {
    const pool = getPool();
    const idempotencyKey = 'business_expense:abc-123:BUSINESS_EXPENSE_RECORDED';

    const first = await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 50,
      idempotencyKey,
    });
    const second = await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 50,
      idempotencyKey,
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.event.id).toBe(first.event.id);

    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM financial_events WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    expect(count.rows[0].n).toBe(1);
  });

  test('inserts distinct rows when no idempotency key is provided', async () => {
    const pool = getPool();
    const a = await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      amount: 200,
    });
    const b = await appendFinancialEvent(pool, {
      eventType: 'INVENTORY_PURCHASE_RECORDED',
      amount: 200,
    });
    expect(a.event.id).not.toBe(b.event.id);

    const count = await pool.query(
      "SELECT COUNT(*)::int AS n FROM financial_events WHERE event_type = 'INVENTORY_PURCHASE_RECORDED'"
    );
    expect(count.rows[0].n).toBe(2);
  });

  test('rejects an unknown event type and writes nothing', async () => {
    const pool = getPool();
    await expect(
      appendFinancialEvent(pool, {
        // @ts-expect-error testing runtime guard with an invalid type
        eventType: 'TOTALLY_MADE_UP',
        amount: 1,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    const count = await pool.query('SELECT COUNT(*)::int AS n FROM financial_events');
    expect(count.rows[0].n).toBe(0);
  });

  test('persists payload as jsonb and reads it back as an object', async () => {
    const pool = getPool();
    const payload = {
      category: 'SHIPPING',
      notes: 'USPS priority',
      nested: { count: 3, tags: ['a', 'b'] },
    };
    const { event } = await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 12.34,
      payload,
    });

    expect(event.payload).toEqual(payload);

    const stored = await pool.query('SELECT payload FROM financial_events WHERE id = $1', [
      event.id,
    ]);
    expect(stored.rows[0].payload).toEqual(payload);
    expect(stored.rows[0].payload.nested.tags).toEqual(['a', 'b']);
  });

  test('persists metadata as jsonb and reads it back as an object', async () => {
    const pool = getPool();
    const metadata = { created_via: 'WEB', route: 'POST /business-expenses' };
    const { event } = await appendFinancialEvent(pool, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 99,
      metadata,
    });

    expect(event.metadata).toEqual(metadata);

    const stored = await pool.query('SELECT metadata FROM financial_events WHERE id = $1', [
      event.id,
    ]);
    expect(stored.rows[0].metadata).toEqual(metadata);
  });

  test('defaults payload and metadata to empty objects', async () => {
    const pool = getPool();
    const { event } = await appendFinancialEvent(pool, {
      eventType: 'FINANCIAL_STRATEGY_CHANGED',
    });
    expect(event.payload).toEqual({});
    expect(event.metadata).toEqual({});
    // Strategy changes carry no amount and are NEUTRAL by default.
    expect(event.amount).toBeNull();
    expect(event.direction).toBe('NEUTRAL');
    expect(event.event_category).toBe('STRATEGY');
  });
});
