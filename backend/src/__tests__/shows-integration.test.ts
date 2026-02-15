/**
 * Shows API integration tests: POST/GET /api/shows.
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

describe('Shows API integration', () => {
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
      AUTH_DEV_BYPASS_USER_ID: 'test-shows-admin',
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
    expect(body.show_date).toBe('2025-03-15');
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
    expect(found.show_date).toBe('2025-04-01');
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
    expect(show.show_date).toBe('2025-05-10');
    expect(show.platform).toBe('OTHER'); // API normalizes MANUAL -> OTHER
    expect(show.name).toBe('Manual Show');
    expect(show.external_reference).toBe('ext-123');
  });
});
