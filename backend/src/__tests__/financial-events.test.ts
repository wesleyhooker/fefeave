/**
 * Unit tests for the financial event writer (no database).
 * Uses a mock Queryable to assert validation, normalization, and SQL shaping.
 * Round-trip persistence is covered in financial-events-integration.test.ts.
 */
import {
  appendFinancialEvent,
  type AppendFinancialEventInput,
  type FinancialEventRow,
  type Queryable,
} from '../services/financial-events';
import { ValidationError } from '../utils/errors';

type QueryCall = { sql: string; values: unknown[] };

/** Mock Queryable that records calls and returns queued results in order. */
function makeMockDb(results: Array<{ rows: unknown[] }>) {
  const calls: QueryCall[] = [];
  let i = 0;
  const db: Queryable = {
    query: ((sql: string, values: unknown[]) => {
      calls.push({ sql, values });
      const result = results[i] ?? { rows: [] };
      i += 1;
      return Promise.resolve(result);
    }) as Queryable['query'],
  };
  return { db, calls };
}

function fakeRowFromValues(values: unknown[]): FinancialEventRow {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    event_type: values[0] as string,
    event_category: values[1] as string,
    occurred_at: new Date(),
    effective_date: (values[3] as string | null) ?? null,
    amount: values[4] == null ? null : String(values[4]),
    currency: values[5] as string,
    direction: (values[6] as string | null) ?? null,
    source_type: (values[7] as string | null) ?? null,
    source_id: (values[8] as string | null) ?? null,
    actor_user_id: (values[9] as string | null) ?? null,
    correlation_id: (values[10] as string | null) ?? null,
    causation_id: (values[11] as string | null) ?? null,
    event_version: values[12] as number,
    idempotency_key: (values[13] as string | null) ?? null,
    payload: JSON.parse(values[14] as string),
    metadata: JSON.parse(values[15] as string),
    created_at: new Date(),
  };
}

const baseInput: AppendFinancialEventInput = {
  eventType: 'BUSINESS_EXPENSE_RECORDED',
};

describe('appendFinancialEvent — validation', () => {
  test('rejects an unknown event type before touching the database', async () => {
    const { db, calls } = makeMockDb([]);
    await expect(
      appendFinancialEvent(db, {
        ...baseInput,
        // @ts-expect-error testing runtime guard with an invalid type
        eventType: 'NOPE_NOT_REAL',
      })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(calls).toHaveLength(0);
  });

  test('rejects a non-finite amount', async () => {
    const { db } = makeMockDb([]);
    await expect(
      appendFinancialEvent(db, { ...baseInput, amount: Number.NaN })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('rejects a malformed effective date', async () => {
    const { db } = makeMockDb([]);
    await expect(
      appendFinancialEvent(db, { ...baseInput, effectiveDate: '05/01/2026' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('rejects an invalid direction override', async () => {
    const { db } = makeMockDb([]);
    await expect(
      // @ts-expect-error testing runtime guard with an invalid direction
      appendFinancialEvent(db, { ...baseInput, direction: 'SIDEWAYS' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('rejects an empty currency', async () => {
    const { db } = makeMockDb([]);
    await expect(
      appendFinancialEvent(db, { ...baseInput, currency: '   ' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('rejects a non-integer event version', async () => {
    const { db } = makeMockDb([]);
    await expect(
      appendFinancialEvent(db, { ...baseInput, eventVersion: 1.5 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('rejects a non-object payload', async () => {
    const { db } = makeMockDb([]);
    await expect(
      // @ts-expect-error testing runtime guard with a non-object payload
      appendFinancialEvent(db, { ...baseInput, payload: 'not-an-object' })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('appendFinancialEvent — normalization and defaults', () => {
  test('derives category and default direction from the catalog', async () => {
    // Mock whose INSERT response echoes a row built from the bound values.
    const db: Queryable = {
      query: ((_sql: string, values: unknown[]) =>
        Promise.resolve({ rows: [fakeRowFromValues(values)] })) as Queryable['query'],
    };

    const result = await appendFinancialEvent(db, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 120.5,
      effectiveDate: '2026-05-01',
    });

    expect(result.created).toBe(true);
    expect(result.event.event_category).toBe('FINANCIAL');
    expect(result.event.direction).toBe('OUTFLOW');
    expect(result.event.currency).toBe('USD');
    expect(result.event.event_version).toBe(1);
  });

  test('serializes payload and metadata as JSON for jsonb columns', async () => {
    const captured: QueryCall[] = [];
    const db: Queryable = {
      query: ((sql: string, values: unknown[]) => {
        captured.push({ sql, values });
        return Promise.resolve({ rows: [fakeRowFromValues(values)] });
      }) as Queryable['query'],
    };

    const payload = { category: 'SHIPPING', notes: 'USPS' };
    const metadata = { created_via: 'WEB', route: 'POST /business-expenses' };
    const result = await appendFinancialEvent(db, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 42,
      payload,
      metadata,
    });

    // payload is param 15 (index 14), metadata is param 16 (index 15).
    expect(captured[0].values[14]).toBe(JSON.stringify(payload));
    expect(captured[0].values[15]).toBe(JSON.stringify(metadata));
    expect(captured[0].sql).toContain('$15::jsonb');
    expect(captured[0].sql).toContain('$16::jsonb');
    expect(result.event.payload).toEqual(payload);
    expect(result.event.metadata).toEqual(metadata);
  });

  test('allows an explicit direction override', async () => {
    const db: Queryable = {
      query: ((_sql: string, values: unknown[]) =>
        Promise.resolve({ rows: [fakeRowFromValues(values)] })) as Queryable['query'],
    };
    const result = await appendFinancialEvent(db, {
      eventType: 'CASH_SNAPSHOT_RECORDED',
      direction: 'NEUTRAL',
      amount: 8500,
    });
    expect(result.event.direction).toBe('NEUTRAL');
    expect(result.event.event_category).toBe('FINANCIAL');
  });
});

describe('appendFinancialEvent — idempotency SQL shaping', () => {
  test('omits the conflict clause when no idempotency key is given', async () => {
    const captured: QueryCall[] = [];
    const db: Queryable = {
      query: ((sql: string, values: unknown[]) => {
        captured.push({ sql, values });
        return Promise.resolve({ rows: [fakeRowFromValues(values)] });
      }) as Queryable['query'],
    };
    await appendFinancialEvent(db, { eventType: 'BUSINESS_EXPENSE_RECORDED', amount: 10 });
    expect(captured[0].sql).not.toContain('ON CONFLICT');
  });

  test('adds the conflict clause and returns created=false on duplicate key', async () => {
    let call = 0;
    const captured: QueryCall[] = [];
    const db: Queryable = {
      query: ((sql: string, values: unknown[]) => {
        captured.push({ sql, values });
        call += 1;
        // 1st call: INSERT ... ON CONFLICT DO NOTHING -> no row returned.
        if (call === 1) return Promise.resolve({ rows: [] });
        // 2nd call: SELECT existing row by idempotency_key.
        return Promise.resolve({
          rows: [
            fakeRowFromValues([
              'BUSINESS_EXPENSE_RECORDED',
              'FINANCIAL',
              new Date(),
              null,
              '10',
              'USD',
              'OUTFLOW',
              null,
              null,
              null,
              null,
              null,
              1,
              'expense:abc:BUSINESS_EXPENSE_RECORDED',
              '{}',
              '{}',
            ]),
          ],
        });
      }) as Queryable['query'],
    };

    const result = await appendFinancialEvent(db, {
      eventType: 'BUSINESS_EXPENSE_RECORDED',
      amount: 10,
      idempotencyKey: 'expense:abc:BUSINESS_EXPENSE_RECORDED',
    });

    expect(captured[0].sql).toContain('ON CONFLICT (idempotency_key)');
    expect(result.created).toBe(false);
    expect(result.event.idempotency_key).toBe('expense:abc:BUSINESS_EXPENSE_RECORDED');
  });
});
