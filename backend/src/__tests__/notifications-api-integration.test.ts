/**
 * Workspace notifications API integration tests (V1 Phase 3).
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

describe('Notifications API integration', () => {
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

  async function resetTables(): Promise<void> {
    const pool = getPool();
    await pool.query('DELETE FROM notification_reads');
    await pool.query('DELETE FROM workspace_notifications');
  }

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('notif-api-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    await resetTables();
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function seedNotification(input: {
    notification_type?: string;
    title: string;
    occurred_at: string;
    idempotency_key: string;
    deleted_at?: Date | null;
  }): Promise<string> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO workspace_notifications (
         notification_type, severity, title, body, href, occurred_at, idempotency_key, deleted_at
       ) VALUES ($1, 'info', $2, NULL, '/admin/dashboard', $3::timestamptz, $4, $5)
       RETURNING id`,
      [
        input.notification_type ?? 'business_expense.recorded',
        input.title,
        input.occurred_at,
        input.idempotency_key,
        input.deleted_at ?? null,
      ]
    );
    return (result.rows[0] as { id: string }).id;
  }

  test('GET /notifications returns items newest first', async () => {
    await seedNotification({
      title: 'Older',
      occurred_at: '2026-06-01T10:00:00.000Z',
      idempotency_key: 'notification:test:1',
    });
    await seedNotification({
      title: 'Newer',
      occurred_at: '2026-06-10T10:00:00.000Z',
      idempotency_key: 'notification:test:2',
    });

    const res = await app.inject({ method: 'GET', url: `${prefix}/notifications` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as {
      items: Array<{ title: string; read: boolean }>;
      page: number;
      limit: number;
      total: number;
      has_more: boolean;
    };

    expect(body.items).toHaveLength(2);
    expect(body.items[0].title).toBe('Newer');
    expect(body.items[1].title).toBe('Older');
    expect(body.items[0].read).toBe(false);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.total).toBe(2);
    expect(body.has_more).toBe(false);
  });

  test('GET /notifications supports pagination and limit', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await seedNotification({
        title: `Item ${i}`,
        occurred_at: `2026-06-${10 + i}T10:00:00.000Z`,
        idempotency_key: `notification:test:page:${i}`,
      });
    }

    const page1 = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications?page=1&limit=2`,
    });
    const body1 = JSON.parse(page1.payload);
    expect(body1.items).toHaveLength(2);
    expect(body1.total).toBe(3);
    expect(body1.has_more).toBe(true);

    const page2 = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications?page=2&limit=2`,
    });
    const body2 = JSON.parse(page2.payload);
    expect(body2.items).toHaveLength(1);
    expect(body2.has_more).toBe(false);
  });

  test('GET /notifications?since= filters by occurred_at', async () => {
    await seedNotification({
      title: 'Before cutoff',
      occurred_at: '2026-06-01T10:00:00.000Z',
      idempotency_key: 'notification:test:since:1',
    });
    await seedNotification({
      title: 'After cutoff',
      occurred_at: '2026-06-15T10:00:00.000Z',
      idempotency_key: 'notification:test:since:2',
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications?since=2026-06-10T00:00:00.000Z`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe('After cutoff');
  });

  test('GET /notifications unread_only filters unread items', async () => {
    const unreadId = await seedNotification({
      title: 'Unread',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:unread:1',
    });
    const readId = await seedNotification({
      title: 'Read',
      occurred_at: '2026-06-12T10:00:00.000Z',
      idempotency_key: 'notification:test:unread:2',
    });

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${readId}/read`,
    });

    const res = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications?unread_only=true`,
    });
    const body = JSON.parse(res.payload);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(unreadId);
  });

  test('GET /notifications/unread-count reflects per-user unread state', async () => {
    await seedNotification({
      title: 'One',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:count:1',
    });
    const secondId = await seedNotification({
      title: 'Two',
      occurred_at: '2026-06-12T10:00:00.000Z',
      idempotency_key: 'notification:test:count:2',
    });

    const initial = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(initial.payload).count).toBe(2);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${secondId}/read`,
    });

    const afterRead = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(afterRead.payload).count).toBe(1);
  });

  test('PATCH /notifications/:id/read marks one notification read and is idempotent', async () => {
    const id = await seedNotification({
      title: 'Mark me',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:mark:1',
    });

    const first = await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${id}/read`,
    });
    expect(first.statusCode).toBe(200);
    const item = JSON.parse(first.payload);
    expect(item.id).toBe(id);
    expect(item.read).toBe(true);

    const second = await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${id}/read`,
    });
    expect(second.statusCode).toBe(200);
    expect(JSON.parse(second.payload).read).toBe(true);

    const count = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(count.payload).count).toBe(0);
  });

  test('PATCH /notifications/read-all marks all unread notifications', async () => {
    await seedNotification({
      title: 'A',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:all:1',
    });
    await seedNotification({
      title: 'B',
      occurred_at: '2026-06-12T10:00:00.000Z',
      idempotency_key: 'notification:test:all:2',
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/read-all`,
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).marked_count).toBe(2);

    const count = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(count.payload).count).toBe(0);
  });

  test('PATCH /notifications/read-all with before marks only older notifications', async () => {
    const olderId = await seedNotification({
      title: 'Older',
      occurred_at: '2026-06-01T10:00:00.000Z',
      idempotency_key: 'notification:test:all-before:1',
    });
    const newerId = await seedNotification({
      title: 'Newer',
      occurred_at: '2026-06-15T10:00:00.000Z',
      idempotency_key: 'notification:test:all-before:2',
    });

    const res = await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/read-all`,
      payload: { before: '2026-06-10T00:00:00.000Z' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload).marked_count).toBe(1);

    const count = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(count.payload).count).toBe(1);

    const list = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications?unread_only=true`,
    });
    const body = JSON.parse(list.payload);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(newerId);

    const olderRead = await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${olderId}/read`,
    });
    expect(JSON.parse(olderRead.payload).read).toBe(true);

    const newerState = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications`,
    });
    const items = JSON.parse(newerState.payload).items as Array<{ id: string; read: boolean }>;
    const newer = items.find((item) => item.id === newerId);
    expect(newer?.read).toBe(false);
  });

  test('user A read does not affect user B unread count', async () => {
    const id = await seedNotification({
      title: 'Shared',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:shared:1',
    });

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/notifications/${id}/read`,
    });

    const countA = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(countA.payload).count).toBe(0);

    await app.close();
    restoreEnv();

    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identityB = buildUniqueDevBypassIdentity('notif-api-user-b', 'OPERATOR');
    const resultB = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identityB,
      PGOPTIONS: '-c search_path=test',
    });
    const appB = resultB.app;

    const countB = await appB.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(countB.payload).count).toBe(1);

    await appB.close();
    resultB.restoreEnv();

    const identityA = buildUniqueDevBypassIdentity('notif-api-admin', 'ADMIN');
    const resultA = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identityA,
      PGOPTIONS: '-c search_path=test',
    });
    app = resultA.app;
    restoreEnv = resultA.restoreEnv;
  });

  test('soft-deleted notifications are excluded from list and unread-count', async () => {
    await seedNotification({
      title: 'Visible',
      occurred_at: '2026-06-11T10:00:00.000Z',
      idempotency_key: 'notification:test:visible:1',
    });
    await seedNotification({
      title: 'Deleted',
      occurred_at: '2026-06-12T10:00:00.000Z',
      idempotency_key: 'notification:test:deleted:1',
      deleted_at: new Date('2026-06-12T12:00:00.000Z'),
    });

    const list = await app.inject({ method: 'GET', url: `${prefix}/notifications` });
    const body = JSON.parse(list.payload);
    expect(body.total).toBe(1);
    expect(body.items[0].title).toBe('Visible');

    const count = await app.inject({
      method: 'GET',
      url: `${prefix}/notifications/unread-count`,
    });
    expect(JSON.parse(count.payload).count).toBe(1);
  });

  test('returns 401 when unauthenticated', async () => {
    await app.close();
    restoreEnv();

    const databaseUrl = process.env.DATABASE_URL ?? '';
    const unauth = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'off',
      PGOPTIONS: '-c search_path=test',
    });

    const res = await unauth.app.inject({
      method: 'GET',
      url: `${prefix}/notifications`,
    });
    expect(res.statusCode).toBe(401);
    await unauth.app.close();
    unauth.restoreEnv();

    const identity = buildUniqueDevBypassIdentity('notif-api-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });

  test('returns 403 for WHOLESALER role', async () => {
    await app.close();
    restoreEnv();

    const databaseUrl = process.env.DATABASE_URL ?? '';
    const wholesalerIdentity = buildUniqueDevBypassIdentity('notif-api-vendor', 'WHOLESALER');
    const wholesalerApp = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...wholesalerIdentity,
      PGOPTIONS: '-c search_path=test',
    });

    const res = await wholesalerApp.app.inject({
      method: 'GET',
      url: `${prefix}/notifications`,
    });
    expect(res.statusCode).toBe(403);

    await wholesalerApp.app.close();
    wholesalerApp.restoreEnv();

    const identity = buildUniqueDevBypassIdentity('notif-api-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
  });
});
