/**
 * Owed line items API integration tests: POST/GET /api/shows/:showId/owed-line-items.
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

describe('Owed line items API integration', () => {
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
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-line-items-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  afterEach(() => {
    restoreEnv?.();
  });

  test('POST owed line item returns 201 with currency USD and status PENDING', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-06-01',
        platform: 'WHATNOT',
        name: 'June Show',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: {
        name: 'ABC Wholesale',
        contact_email: 'abc@example.com',
      },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/owed-line-items`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: '1250.50',
        description: 'Booth rental fee',
        due_date: '2025-07-15',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.show_id).toBe(show.id);
    expect(body.wholesaler_id).toBe(wholesaler.id);
    expect(Number(body.amount)).toBeCloseTo(1250.5, 4);
    expect(body.currency).toBe('USD');
    expect(body.description).toBe('Booth rental fee');
    expect(body.due_date).toBe('2025-07-15');
    expect(body.status).toBe('PENDING');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET owed line items includes created item', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: {
        show_date: '2025-07-01',
        platform: 'INSTAGRAM',
        name: 'July Live',
      },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    const wholesalerRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name: 'XYZ Supplies' },
    });
    expect(wholesalerRes.statusCode).toBe(201);
    const wholesaler = JSON.parse(wholesalerRes.payload);

    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/owed-line-items`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 500,
        description: 'Setup fee',
      },
    });
    expect(postRes.statusCode).toBe(201);
    const created = JSON.parse(postRes.payload);

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${show.id}/owed-line-items`,
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload);
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((i: { id: string }) => i.id === created.id);
    expect(found).toBeDefined();
    expect(Number(found.amount)).toBe(500);
    expect(found.currency).toBe('USD');
    expect(found.description).toBe('Setup fee');
    expect(found.status).toBe('PENDING');
  });
});
