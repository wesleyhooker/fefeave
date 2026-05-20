/**
 * Shared product language for the admin money workflow (week snapshot, self-pay,
 * log-show entry, cross-surface labels). Import from pages/components — not
 * user-facing configuration.
 */

export const WORKFLOW_THIS_WEEK_HEADING = 'This week';

/** Ties the dashboard greeting to the same week anchor used on Shows. */
export function workflowDashboardWeekSubtitle(
  weekRangeCompact: string,
): string {
  return `${WORKFLOW_THIS_WEEK_HEADING} · ${weekRangeCompact}`;
}

/** Shows page — table column & compact profit line (no “Est.” wording). */
export const WORKFLOW_SHOWS_PROFIT_LABEL = 'Profit';

/** Shows index — page intro subtitle. */
export const WORKFLOW_SHOWS_PAGE_SUBTITLE =
  'Manage live sale records, payouts, and weekly history.';

export const WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE = 'Record owner payout?';
export const WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_DESCRIPTION =
  'Record this week payout to Owner activity.';
export const WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL = 'Record payout';
export const WORKFLOW_SELF_PAY_MARK_PAID_TOGGLE_LABEL = 'Mark paid';

export const WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE = 'Void owner payout?';
export const WORKFLOW_SELF_PAY_REOPEN_DIALOG_DESCRIPTION =
  'This keeps the row in Owner activity as voided for audit history.';
export const WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL = 'Void payout';

export const WORKFLOW_SELF_PAY_MARKED_PAID_LABEL = 'Marked paid';

export const WORKFLOW_EMPTY_WEEK_SCHEDULE = 'None scheduled this week.';

export const WORKFLOW_SHOW_FINANCES_PAYOUT_HINT =
  "Set payout after fees first — percent uses that amount, and totals can't exceed it.";

export const WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST =
  'Set payout after fees first.';

export const WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY =
  'Save payout, then try again.';

/** Read-only payout / profit column before close-out. */
export const WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING = 'Summary';

export const WORKFLOW_LOG_SHOW_TRIGGER_LABEL = 'Log show';
export const WORKFLOW_LOG_SHOW_PANEL_TITLE = 'Log a show';
export const WORKFLOW_LOG_SHOW_PANEL_SUBTITLE =
  'Date, platform, and starting payout — then continue on the show page.';

/** Short in-form reminder for the drawer variant (panel title carries the main context). */
export const WORKFLOW_LOG_SHOW_FORM_DRAWER_NOTE =
  'Next: show page for settlements, receipt, and close-out.';

export const WORKFLOW_NEEDS_ATTENTION_HEADING = 'Needs attention';

export const WORKFLOW_ACTIVE_SHOWS_ROW_LABEL = 'Shows still open';

export const WORKFLOW_WHOLESALERS_WITH_BALANCE_ROW_LABEL =
  'Wholesalers with a balance';

/** Balances index */
export const WORKFLOW_BALANCES_PAGE_SUBTITLE =
  'Wholesaler balances from your shows.';

/** Balances index — header primary action (plus icon from {@link WorkspaceSidePanelTrigger}). */
export const WORKFLOW_NEW_WHOLESALER_TRIGGER_LABEL = 'New wholesaler';
