/**
 * Workspace notification creation hooks (V1 Phase 2).
 * Requires Postgres and DATABASE_URL. Run with: npm run test:integration
 */
import type { FastifyInstance } from 'fastify';
import { getPool } from '../db';
import { createWorkspaceNotification } from '../services/workspace-notifications';
import { buildAppForTest, buildUniqueDevBypassIdentity, runTestSchemaMigrations } from './helpers';

type WorkspaceNotificationRow = {
  id: string;
  notification_type: string;
  title: string;
  idempotency_key: string;
  financial_event_id: string | null;
  source_id: string | null;
};

describe('Workspace notification hooks integration', () => {
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

  async function resetNotificationTables(): Promise<void> {
    const pool = getPool();
    await pool.query('DELETE FROM notification_reads');
    await pool.query('DELETE FROM workspace_notifications');
    await pool.query('DELETE FROM financial_events');
    await pool.query('DELETE FROM strategy_allocation_entries');
    await pool.query('DELETE FROM owner_self_pay_transactions');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM owed_line_items');
    await pool.query('DELETE FROM inventory_purchases');
    await pool.query('DELETE FROM business_expenses');
    await pool.query('DELETE FROM show_financials');
    await pool.query('DELETE FROM shows');
    await pool.query('DELETE FROM cash_snapshots');
    await pool.query('DELETE FROM financial_strategy_settings');
  }

  beforeEach(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('notifications-admin', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      NOTIFICATIONS_WRITE_ENABLED: 'true',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    await resetNotificationTables();
  });

  afterEach(async () => {
    if (app) await app.close();
    restoreEnv?.();
  });

  async function notificationsByType(type: string): Promise<WorkspaceNotificationRow[]> {
    const result = await getPool().query(
      `SELECT id, notification_type, title, idempotency_key, financial_event_id, source_id
       FROM workspace_notifications
       WHERE notification_type = $1 AND deleted_at IS NULL
       ORDER BY occurred_at ASC, id ASC`,
      [type]
    );
    return result.rows as WorkspaceNotificationRow[];
  }

  async function notificationCount(): Promise<number> {
    const result = await getPool().query(
      `SELECT COUNT(*)::int AS count FROM workspace_notifications WHERE deleted_at IS NULL`
    );
    return (result.rows[0] as { count: number }).count;
  }

  async function seedBalancedStrategy(): Promise<void> {
    await getPool().query(
      `INSERT INTO financial_strategy_settings (
         scope_key, strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount
       ) VALUES ('global', 'BALANCED', 3000, 5000, 2000)
       ON CONFLICT (scope_key) DO UPDATE SET
         strategy_type = EXCLUDED.strategy_type,
         tax_reserve_bps = EXCLUDED.tax_reserve_bps,
         reinvestment_bps = EXCLUDED.reinvestment_bps,
         cash_buffer_amount = EXCLUDED.cash_buffer_amount,
         updated_at = NOW()`
    );
  }

  async function createCompletedShow(
    showDate: string,
    payout: number,
    name = 'Notification Show'
  ): Promise<{ id: string }> {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: showDate, platform: 'WHATNOT', name },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload) as { id: string };
    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: payout },
    });
    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    return show;
  }

  async function createWholesaler(name: string): Promise<{ id: string }> {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers`,
      payload: { name },
    });
    expect(res.statusCode).toBe(201);
    return JSON.parse(res.payload);
  }

  test('vendor payment recorded creates one notification', async () => {
    const wholesaler = await createWholesaler('Notify Pay Co');
    await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 100, description: 'Invoice' },
    });
    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 50,
        payment_date: '2026-08-01',
      },
    });
    expect(paymentRes.statusCode).toBe(201);
    const payment = JSON.parse(paymentRes.payload);

    const rows = await notificationsByType('vendor_payment.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Payment recorded');
    expect(rows[0].source_id).toBe(payment.id);
    expect(rows[0].idempotency_key).toMatch(/^notification:financial_event:/);
    expect(rows[0].financial_event_id).toBeTruthy();
  });

  test('vendor payment corrected creates one notification', async () => {
    const wholesaler = await createWholesaler('Notify Correct Co');
    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 50,
        payment_date: '2026-08-01',
      },
    });
    const payment = JSON.parse(paymentRes.payload);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/payments/${payment.id}`,
      payload: {
        amount: 75,
        payment_date: '2026-08-05',
        reference: 'CHK-75',
      },
    });
    expect(patchRes.statusCode).toBe(200);

    const rows = await notificationsByType('vendor_payment.corrected');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Payment corrected');
  });

  test('vendor payment voided creates one notification', async () => {
    const wholesaler = await createWholesaler('Notify Void Co');
    const paymentRes = await app.inject({
      method: 'POST',
      url: `${prefix}/payments`,
      payload: {
        wholesaler_id: wholesaler.id,
        amount: 50,
        payment_date: '2026-08-01',
      },
    });
    const payment = JSON.parse(paymentRes.payload);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/payments/${payment.id}`,
    });
    expect(delRes.statusCode).toBe(204);

    const rows = await notificationsByType('vendor_payment.voided');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Payment voided');
  });

  test('inventory purchase recorded creates one notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/inventory-purchases`,
      payload: {
        purchase_date: '2026-06-15',
        amount: 120,
        supplier: 'Gem Supplier',
      },
    });
    expect(res.statusCode).toBe(201);
    const purchase = JSON.parse(res.payload);

    const rows = await notificationsByType('inventory_purchase.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].source_id).toBe(purchase.id);
  });

  test('business expense recorded creates one notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-06-10',
        amount: 35.5,
        category: 'Shipping',
      },
    });
    expect(res.statusCode).toBe(201);
    const expense = JSON.parse(res.payload);

    const rows = await notificationsByType('business_expense.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].source_id).toBe(expense.id);
  });

  test('owner payout recorded creates one notification', async () => {
    await seedBalancedStrategy();
    await createCompletedShow('2026-05-15', 800, 'Owner Payout Show');

    const res = await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-12`,
      payload: {
        week_end_date: '2026-05-18',
        transaction_type: 'OWNER_DRAW',
      },
    });
    expect(res.statusCode).toBe(200);

    const rows = await notificationsByType('owner_payout.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Owner payout recorded');
  });

  test('owner payout voided creates one notification', async () => {
    await seedBalancedStrategy();
    await createCompletedShow('2026-05-22', 400, 'Owner Void Show');

    await app.inject({
      method: 'PUT',
      url: `${prefix}/owner-self-pay/2026-05-19`,
      payload: {
        week_end_date: '2026-05-25',
        transaction_type: 'OWNER_DRAW',
      },
    });

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/owner-self-pay/2026-05-19`,
    });
    expect(delRes.statusCode).toBe(204);

    const rows = await notificationsByType('owner_payout.voided');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Owner payout voided');
  });

  test('tax set-aside recorded creates one notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'TAX_SET_ASIDE', amount: 100 },
    });
    expect(res.statusCode).toBe(201);
    const entry = JSON.parse(res.payload);

    const rows = await notificationsByType('tax_set_aside.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].source_id).toBe(entry.id);
  });

  test('reinvestment recorded creates one notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'REINVESTMENT_SET_ASIDE', amount: 80 },
    });
    expect(res.statusCode).toBe(201);

    const rows = await notificationsByType('reinvestment.recorded');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Reinvestment recorded');
  });

  test('settlement created creates one notification', async () => {
    const wholesaler = await createWholesaler('Notify Settlement Co');
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 150, description: 'Show consignment' },
    });
    expect(res.statusCode).toBe(201);
    const expense = JSON.parse(res.payload);

    const rows = await notificationsByType('settlement.created');
    expect(rows).toHaveLength(1);
    expect(rows[0].source_id).toBe(expense.id);
  });

  test('settlement voided creates one notification', async () => {
    const wholesaler = await createWholesaler('Notify Settlement Void Co');
    const createRes = await app.inject({
      method: 'POST',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses`,
      payload: { amount: 90, description: 'To void' },
    });
    const expense = JSON.parse(createRes.payload);

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/wholesalers/${wholesaler.id}/vendor-expenses/${expense.id}`,
    });
    expect(delRes.statusCode).toBe(204);

    const rows = await notificationsByType('settlement.voided');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Vendor obligation voided');
  });

  test('show closed creates one notification on status transition to COMPLETED', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2026-06-20', platform: 'WHATNOT', name: 'Notify Close Show' },
    });
    expect(showRes.statusCode).toBe(201);
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 500 },
    });

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(closeRes.statusCode).toBe(200);

    const rows = await notificationsByType('show.closed');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Show closed');
    expect(rows[0].idempotency_key).toBe(`notification:show.closed:${show.id}`);
    expect(rows[0].financial_event_id).toBeNull();
  });

  test('payout edit before close does not create show.closed notification', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2026-06-21', platform: 'WHATNOT', name: 'Payout Edit Show' },
    });
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 400 },
    });

    const editRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 450 },
    });
    expect(editRes.statusCode).toBe(200);

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const rows = await notificationsByType('show.closed');
    expect(rows).toHaveLength(1);
    expect(await notificationsByType('show_payout.updated')).toHaveLength(0);
  });

  test('duplicate close does not create duplicate show.closed notification', async () => {
    const showRes = await app.inject({
      method: 'POST',
      url: `${prefix}/shows`,
      payload: { show_date: '2026-06-22', platform: 'WHATNOT', name: 'Dup Close Show' },
    });
    const show = JSON.parse(showRes.payload);

    await app.inject({
      method: 'POST',
      url: `${prefix}/shows/${show.id}/financials`,
      payload: { payout_after_fees_amount: 300 },
    });

    await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });

    const again = await app.inject({
      method: 'PATCH',
      url: `${prefix}/shows/${show.id}`,
      payload: { status: 'COMPLETED' },
    });
    expect(again.statusCode).toBe(200);

    const rows = await notificationsByType('show.closed');
    expect(rows).toHaveLength(1);
  });

  test('NOTIFICATIONS_WRITE_ENABLED=false creates no notifications', async () => {
    await app.close();
    restoreEnv();

    const databaseUrl = process.env.DATABASE_URL ?? '';
    const identity = buildUniqueDevBypassIdentity('notifications-disabled', 'ADMIN');
    const result = await buildAppForTest({
      DATABASE_URL: databaseUrl,
      AUTH_MODE: 'dev_bypass',
      NOTIFICATIONS_WRITE_ENABLED: 'false',
      ...identity,
      PGOPTIONS: '-c search_path=test',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    await resetNotificationTables();

    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/business-expenses`,
      payload: {
        expense_date: '2026-06-11',
        amount: 10,
        category: 'Other',
      },
    });
    expect(res.statusCode).toBe(201);

    expect(await notificationCount()).toBe(0);

    const events = await getPool().query(
      `SELECT COUNT(*)::int AS count FROM financial_events WHERE event_type = 'BUSINESS_EXPENSE_RECORDED'`
    );
    expect((events.rows[0] as { count: number }).count).toBe(1);
  });

  test('cash snapshot recorded does not create a notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${prefix}/cash-snapshots`,
      payload: { snapshot_date: '2026-07-01', amount: 1000 },
    });
    expect(res.statusCode).toBe(201);

    expect(await notificationCount()).toBe(0);
  });

  test('strategy allocation void does not create owner_payout voided notification', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `${prefix}/owner-self-pay/2026-06-02/allocations`,
      payload: { allocation_type: 'REINVESTMENT_SET_ASIDE', amount: 40 },
    });
    const entry = JSON.parse(create.payload);

    await app.inject({
      method: 'DELETE',
      url: `${prefix}/strategy-allocation-entries/${entry.id}`,
    });

    expect(await notificationsByType('reinvestment.recorded')).toHaveLength(1);
    expect(await notificationsByType('owner_payout.voided')).toHaveLength(0);
  });

  test('duplicate active idempotency key creates one row', async () => {
    const pool = getPool();
    const key = 'notification:test:idempotent:active';
    const input = {
      notificationType: 'business_expense.recorded',
      severity: 'info',
      title: 'Expense',
      href: '/admin/purchases?tab=expenses',
      idempotencyKey: key,
    };

    const first = await createWorkspaceNotification(pool, input);
    const second = await createWorkspaceNotification(pool, input);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.notification?.id).toBe(first.notification?.id);

    const count = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM workspace_notifications
       WHERE idempotency_key = $1 AND deleted_at IS NULL`,
      [key]
    );
    expect((count.rows[0] as { n: number }).n).toBe(1);
  });

  test('soft-deleted prior notification allows new row with same idempotency key', async () => {
    const pool = getPool();
    const key = 'notification:test:idempotent:soft-deleted';
    const input = {
      notificationType: 'business_expense.recorded',
      severity: 'info',
      title: 'Original',
      href: '/admin/purchases?tab=expenses',
      idempotencyKey: key,
    };

    const first = await createWorkspaceNotification(pool, input);
    expect(first.created).toBe(true);
    const firstId = first.notification!.id;

    await pool.query(`UPDATE workspace_notifications SET deleted_at = NOW() WHERE id = $1`, [
      firstId,
    ]);

    const replay = await createWorkspaceNotification(pool, {
      ...input,
      title: 'Replacement',
    });

    expect(replay.created).toBe(true);
    expect(replay.notification?.id).not.toBe(firstId);
    expect(replay.notification?.title).toBe('Replacement');

    const active = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM workspace_notifications
       WHERE idempotency_key = $1 AND deleted_at IS NULL`,
      [key]
    );
    expect((active.rows[0] as { n: number }).n).toBe(1);
  });
});
