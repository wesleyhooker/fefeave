/**
 * Notification hooks for financial event dual-write (V1 Phase 2).
 *
 * Wraps appendFinancialEvent and notifies when a new ledger row is created.
 */
import {
  appendFinancialEvent,
  type AppendFinancialEventInput,
  type AppendFinancialEventResult,
  type Queryable,
} from './financial-events';
import type { NotificationRuleContext } from './notification-rules';
import { notifyFromFinancialEvent, notifyFromRule } from './workspace-notifications';

/**
 * Append a financial event and create a workspace notification when the event is new.
 * Notification failures never throw — domain writes must succeed.
 */
export async function appendFinancialEventWithNotification(
  db: Queryable,
  input: AppendFinancialEventInput,
  notificationContext: NotificationRuleContext = {}
): Promise<AppendFinancialEventResult> {
  const result = await appendFinancialEvent(db, input);
  if (result.created) {
    await notifyFromFinancialEvent(db, result.event, notificationContext);
  }
  return result;
}

/** Persist show.closed when a show transitions to COMPLETED (not payout edits). */
export async function notifyShowClosed(
  db: Queryable,
  showId: string,
  actorUserId: string | null
): Promise<void> {
  const result = await db.query(
    `SELECT s.name, sf.payout_after_fees_amount
     FROM shows s
     LEFT JOIN show_financials sf ON sf.show_id = s.id
     WHERE s.id = $1 AND s.deleted_at IS NULL`,
    [showId]
  );
  if (result.rows.length === 0) return;

  const row = result.rows[0] as {
    name: string;
    payout_after_fees_amount: string | null;
  };

  await notifyFromRule(db, 'show.closed', {
    showId,
    showName: row.name,
    payoutAmount: row.payout_after_fees_amount,
    actorUserId,
  });
}
