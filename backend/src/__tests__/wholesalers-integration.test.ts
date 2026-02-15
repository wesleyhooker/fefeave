/**
 * Wholesalers API integration tests: POST/GET /api/wholesalers.
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

describe('Wholesalers API integration', () => {
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
      AUTH_DEV_BYPASS_USER_ID: 'test-wholesalers-admin',
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

  test('POST /api/wholesalers returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: {
        name: 'ABC Wholesale',
        contact_email: 'contact@abc.com',
        contact_phone: '+1-555-0100',
        notes: 'Primary supplier',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('ABC Wholesale');
    expect(body.contact_email).toBe('contact@abc.com');
    expect(body.contact_phone).toBe('+1-555-0100');
    expect(body.notes).toBe('Primary supplier');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  test('GET /api/wholesalers includes created wholesaler', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: {
        name: 'XYZ Supplies',
        notes: 'Test wholesaler',
      },
    });
    expect(postRes.statusCode).toBe(201);
    const created = JSON.parse(postRes.payload);

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/wholesalers`,
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.payload);
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((w: { id: string }) => w.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('XYZ Supplies');
    expect(found.notes).toBe('Test wholesaler');
  });
});
