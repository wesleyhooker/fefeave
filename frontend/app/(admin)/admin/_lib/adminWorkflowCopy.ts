/**
 * Shared product language for the admin money workflow (week snapshot, self-pay,
 * log-show entry, cross-surface labels). Import from pages/components — not
 * user-facing configuration.
 */

export const WORKFLOW_THIS_WEEK_HEADING = 'This week';

/** Shows index — current operating period (today: ISO week bounds). */
export const WORKFLOW_CURRENT_PERIOD_HEADING = 'Current period';

/** Shows index — scheduled periods after the current ISO week. */
export const WORKFLOW_UPCOMING_PERIODS_HEADING = 'Upcoming periods';

/** @deprecated Use {@link WORKFLOW_UPCOMING_PERIODS_HEADING}. */
export const WORKFLOW_UPCOMING_WEEKS_HEADING =
  WORKFLOW_UPCOMING_PERIODS_HEADING;

/** Shows index — prior ISO week buckets. */
export const WORKFLOW_PAST_PERIODS_HEADING = 'Past periods';

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
  'Run this period’s shows, close them out, and browse past periods when you need history.';

/** Shows index — exception state (ACTIVE across all weeks). */
export const WORKFLOW_OPEN_SHOWS_HEADING = 'Open shows';
export const WORKFLOW_OPEN_SHOWS_ATTENTION_HEADING = 'Shows need close-out';
export const WORKFLOW_OPEN_SHOWS_SECTION_HINT =
  'Finish payout and close-out on each open show — usually a short cleanup list.';
export const WORKFLOW_EMPTY_OPEN_SHOWS = 'No open shows.';

/** Shows index — operational rail */
export const WORKFLOW_SHOWS_RAIL_CLOSE_OUT_HEADING = 'Needs close-out';
export const WORKFLOW_SHOWS_RAIL_VIEW_ALL_OPEN = 'View all open shows';
/** Shows index rail — period execution (Business Health). */
export const WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_HEADING = 'Period plan';
export const WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_UNAVAILABLE =
  'Close a show this period to unlock period plan.';
/** @deprecated Removed from Shows rail — use {@link WORKFLOW_SHOWS_RAIL_PERIOD_PLAN_HEADING}. */
export const WORKFLOW_SHOWS_RAIL_WEEK_SNAPSHOT_HEADING = 'Current week';
export const WORKFLOW_SHOWS_ARCHIVE_HEADING = 'Archive';
/** Log show lives in the page intro primary action. */
export const WORKFLOW_SHOWS_LOG_SHOW_RAIL_HINT =
  'Log a show to start payout and close-out on its detail page.';
export const WORKFLOW_SHOWS_VIEW_NEEDS_ATTENTION = 'View dashboard attention';
export const WORKFLOW_SHOWS_UNSCHEDULED_ATTENTION_LABEL = 'No show date';
export const WORKFLOW_SHOWS_BUSINESS_HEALTH_RAIL_LABEL =
  'Business Health this week';
export const WORKFLOW_SHOWS_BUSINESS_HEALTH_TEASER_FALLBACK =
  'Track tax set-aside, reinvestment, and owner payout in Business Health.';

export const WORKFLOW_SHOWS_THIS_WEEK_SUPPORT_HEADING = 'This week summary';

export const WORKFLOW_EMPTY_WEEK_SCHEDULE = 'None scheduled this week.';

/** Shows index — current period empty state (illustrated). */
export const WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_TITLE =
  'No shows recorded this period';
export const WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_BODY =
  'Log your first show for this period to track payouts, vendor obligations, and profit.';

/** @deprecated Filter removed from Shows index. */
export const WORKFLOW_SHOWS_PERIOD_FILTER_EMPTY =
  'No shows match this filter in the current period.';

/** @deprecated Use period empty-state copy on Shows index. */
export const WORKFLOW_SHOWS_THIS_WEEK_EMPTY_TITLE =
  WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_TITLE;
/** @deprecated Use period empty-state copy on Shows index. */
export const WORKFLOW_SHOWS_THIS_WEEK_EMPTY_BODY =
  WORKFLOW_SHOWS_CURRENT_PERIOD_EMPTY_BODY;

export const WORKFLOW_SHOW_FINANCES_PAYOUT_HINT =
  "Set payout after fees first — percent uses that amount, and totals can't exceed it.";

export const WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST =
  'Set payout after fees first.';

export const WORKFLOW_SHOW_FINANCES_SAVE_THEN_RETRY =
  'Save payout, then try again.';

/** Read-only payout / profit column before close-out. */
export const WORKFLOW_SHOW_CLOSEOUT_SUMMARY_HEADING = 'Summary';

/** Summary sidebar: payout line (already net of platform fees). */
export const WORKFLOW_SHOW_SUMMARY_PAYOUT_LABEL = 'Payout after fees';

/**
 * Platform fee captured on financials — informational only; not subtracted from
 * estimated profit (payout already reflects fees).
 */
export const WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_EYEBROW =
  'Recorded for reporting';

export const WORKFLOW_SHOW_PLATFORM_FEE_REPORTING_NOTE =
  'Saved for future platform analysis. Already reflected in payout after fees — not subtracted again from estimated profit.';

/** Log-show form: optional platform fee field. */
export const WORKFLOW_LOG_SHOW_PLATFORM_FEE_HINT =
  'Optional. Record what the platform charged for future analysis. Your payout-after-fees amount already accounts for this.';

export const WORKFLOW_LOG_SHOW_TRIGGER_LABEL = 'Log show';
/** Shows index hero — primary create action (same handler as {@link WORKFLOW_LOG_SHOW_TRIGGER_LABEL}). */
export const WORKFLOW_SHOWS_HERO_LOG_LABEL = 'Log New Show';
export const WORKFLOW_SHOWS_HERO_HEADING = "Let's log another great show.";
export const WORKFLOW_SHOWS_RAIL_UPCOMING_HEADING = 'Upcoming';
export const WORKFLOW_SHOWS_RAIL_VIEW_ALL_UPCOMING = 'View all upcoming';
export const WORKFLOW_SHOWS_RAIL_VIEW_ARCHIVE = 'View archive';
export const WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_1 = 'Keep showing up.';
export const WORKFLOW_SHOWS_RAIL_MOTIVATION_LINE_2 =
  'The next sales take care of themselves.';
export const WORKFLOW_SHOWS_INDEX_SEARCH_PLACEHOLDER = 'Search shows…';
export const WORKFLOW_SHOWS_INDEX_STATUS_ALL = 'All statuses';
export const WORKFLOW_SHOWS_INDEX_EXPORT_LABEL = 'Export';
export const WORKFLOW_SHOWS_INDEX_EXPORT_CSV = 'Download shows CSV';
export const WORKFLOW_SHOWS_INDEX_OWED_LABEL = 'Owed';
export const WORKFLOW_SHOWS_INDEX_SHOWS_COUNT_LABEL = 'Shows';
export const WORKFLOW_LOG_SHOW_PANEL_TITLE = 'Log a show';
export const WORKFLOW_LOG_SHOW_PANEL_SUBTITLE =
  'Date, platform, and name — add payout on the show page when ready.';

/** Short in-form reminder for the drawer variant (panel title carries the main context). */
export const WORKFLOW_LOG_SHOW_FORM_DRAWER_NOTE =
  'Next: show page for vendor obligations, receipt, and close-out.';

/** Show detail — vendor obligations section (settlements in code/API). */
export const WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HEADING = 'Vendor obligations';

export const WORKFLOW_SHOW_VENDOR_OBLIGATIONS_HINT =
  'What you owe vendors from this show. Vendor payments are recorded from Vendor Detail.';

export const WORKFLOW_SHOW_LOCKED_BANNER =
  'Completed — locked. Reopen below to edit payout or vendor obligations.';

export const WORKFLOW_SHOW_CLOSED_SUCCESS_TOAST =
  "Show closed successfully. Profit now counts toward this week's totals.";

/** Shows index — temporary row note after close redirect (replaces page-level banner). */
export const WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE =
  'Show closed successfully';

export const WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL =
  "Completed — locked · Profit counts toward this week's totals.";

export const WORKFLOW_SHOW_STATUS_OPEN_LABEL = 'Open — needs close-out';

export const WORKFLOW_SHOW_STATUS_COMPLETED_LABEL = 'Completed — locked';

/** Show detail rail — contextual status (not financial summary). */
export const WORKFLOW_SHOW_DETAIL_STATUS_HEADING = 'Show status';

export const WORKFLOW_SHOW_DETAIL_STATUS_COMPLETED_TITLE = 'Completed';

export const WORKFLOW_SHOW_DETAIL_STATUS_LOCKED_LABEL = 'Locked';

export const WORKFLOW_SHOW_DETAIL_STATUS_FINALIZED_BODY =
  'This show has been finalized.';

export const WORKFLOW_SHOW_DETAIL_STATUS_OPEN_TITLE = 'Open';

export const WORKFLOW_SHOW_DETAIL_STATUS_OPEN_BODY =
  'This show still needs close-out.';

export const WORKFLOW_SHOW_DETAIL_REOPEN_HINT =
  'Reopening will unlock payout and vendor obligations for editing.';

export const WORKFLOW_NEEDS_ATTENTION_HEADING = 'Needs attention';

export const WORKFLOW_BUSINESS_SNAPSHOT_HEADING = 'Business snapshot';

export const WORKFLOW_RECENT_ACTIVITY_HEADING = 'Recent activity';

export const WORKFLOW_RECENT_ACTIVITY_VIEW_ALL = 'View all activity';

export const WORKFLOW_RECENT_ACTIVITY_EMPTY =
  'No recent activity yet. Closed shows, payments, and purchases will appear here.';

export const WORKFLOW_QUICK_ACTIONS_HEADING = 'Quick actions';

export const WORKFLOW_DASHBOARD_OWNER_PAYOUT_LABEL = 'Owner payout';

export const WORKFLOW_BUSINESS_HEALTH_TITLE = 'Business Health';
export const WORKFLOW_BUSINESS_HEALTH_SUBTITLE =
  'See where your business stands, track targets vs recorded set-asides and owner payout, and act on what is left this period.';

export const WORKFLOW_BH_CASH_POSITION_HEADING = 'Cash position';
export const WORKFLOW_BH_ESTIMATED_CASH_LABEL = 'Estimated cash';
export const WORKFLOW_BH_SNAPSHOT_ANCHOR_LABEL = 'Last reconciled snapshot';
export const WORKFLOW_BH_INFLOWS_LABEL = 'Inflows since snapshot';
export const WORKFLOW_BH_OUTFLOWS_LABEL = 'Outflows since snapshot';
export const WORKFLOW_BH_UPDATE_SNAPSHOT = 'Update cash snapshot';
export const WORKFLOW_BH_VIEW_LEDGER = 'View in ledger';
export const WORKFLOW_BH_SNAPSHOT_UNAVAILABLE =
  'Add a cash snapshot to unlock recommendations.';
export const WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING = 'This Period Plan';
/** @deprecated Use {@link WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING}. */
export const WORKFLOW_BH_EXECUTION_TRACKING_HEADING =
  WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING;
export const WORKFLOW_BH_EXECUTION_TRACKING_INTRO =
  'Track targets, what you have recorded, and what is left for Tax Set Aside, Reinvestment, and Owner Payout this period.';
export const WORKFLOW_BH_PLAN_WATERFALL_TITLE =
  'How this period plan is calculated';
export const WORKFLOW_BH_PLAN_STARTING_PROFIT = 'Starting profit';
export const WORKFLOW_BH_PLAN_TAX_TARGET = 'Tax Set Aside target';
export const WORKFLOW_BH_PLAN_AFTER_TAX = 'After tax';
export const WORKFLOW_BH_PLAN_REINVEST_TARGET = 'Reinvestment target';
export const WORKFLOW_BH_PLAN_OWNER_TARGET = 'Owner Payout allowed';
export const WORKFLOW_BH_PLAN_ESTIMATED_CASH_LIMIT = 'Estimated cash limit';
export const WORKFLOW_BH_PLAN_CASH_ADJUSTED_NOTE =
  'Estimated cash lowers Owner Payout this period.';
export const WORKFLOW_BH_VIEW_THIS_PERIOD_PLAN = 'View this period plan';
export const WORKFLOW_BH_RECORD_OWNER_PAYOUT_PANEL_TITLE =
  'Record owner payout';
export const WORKFLOW_BH_RECORD_OWNER_PAYOUT_AMOUNT_LABEL = 'Amount';
export const WORKFLOW_BH_RECORD_OWNER_PAYOUT_NOTE_LABEL = 'Note (optional)';
export const WORKFLOW_BH_RECORD_OWNER_PAYOUT_REMAINING_HINT =
  'Remaining Owner Payout';
export const WORKFLOW_BH_RECORD_OWNER_PAYOUT_REVIEW_NOTE =
  'Review the amount before saving. The server records the full remaining Owner Payout for this period.';
export const WORKFLOW_BH_EXECUTION_UNAVAILABLE =
  'Close shows this week to see tax, reinvestment, and owner payout targets.';
export const WORKFLOW_BH_COL_RECORDED = 'Recorded';
export const WORKFLOW_BH_COL_REMAINING = 'Remaining';
export const WORKFLOW_BH_COL_ACTION = 'Action';
export const WORKFLOW_BH_ROW_TAX_SET_ASIDE = 'Tax Set Aside';
export const WORKFLOW_BH_ROW_REINVESTMENT = 'Reinvestment';
export const WORKFLOW_BH_ROW_OWNER_PAYOUT = 'Owner Payout';
export const WORKFLOW_BH_RECORD_TAX_SET_ASIDE = 'Record tax set aside';
export const WORKFLOW_BH_RECORD_REINVESTMENT = 'Record reinvestment';
export const WORKFLOW_BH_VIEW_LEDGER_ROW = 'View in ledger';
export const WORKFLOW_BH_VIEW_PAYOUT_HISTORY = 'View payout history';
export const WORKFLOW_BH_SUMMARY_HEADING = 'This period at a glance';
export const WORKFLOW_BH_SUMMARY_TAX_REMAINING = 'Tax Set Aside remaining';
export const WORKFLOW_BH_SUMMARY_REINVEST_REMAINING = 'Reinvestment remaining';
export const WORKFLOW_BH_SUMMARY_OWNER_REMAINING = 'Owner Payout remaining';
export const WORKFLOW_BH_COL_STATUS = 'Status';
export const WORKFLOW_BH_VIEW_SET_ASIDE_ENTRIES = 'View set-aside entries';
export const WORKFLOW_BH_SET_ASIDE_ENTRIES_VOID_HINT =
  'Open set-aside entries to void a recorded amount.';
export const WORKFLOW_BH_VOID_OWNER_PAYOUT_LABEL = 'Void payout';
export const WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_TITLE =
  'Void this owner payout?';
export const WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_DESC =
  'The payout stays in history as voided. You can record again if remaining allows.';
export const WORKFLOW_BH_VOID_OWNER_PAYOUT_CONFIRM = 'Void payout';
export const WORKFLOW_BH_STATUS_NOT_STARTED = 'Not started';
export const WORKFLOW_BH_STATUS_PARTIAL_SET_ASIDE = 'Partially set aside';
export const WORKFLOW_BH_STATUS_PARTIAL_PAID = 'Partially paid';
export const WORKFLOW_BH_STATUS_COMPLETE = 'Complete';
export const WORKFLOW_BH_STATUS_NO_TARGET = 'No target';
export const WORKFLOW_BH_SET_ASIDE_ENTRIES_HEADING =
  'Set-aside entries this period';
export const WORKFLOW_BH_SET_ASIDE_ENTRIES_EMPTY =
  'No entries recorded for this period yet.';
export const WORKFLOW_BH_RECORD_TAX_PANEL_TITLE = 'Record tax set aside';
export const WORKFLOW_BH_RECORD_REINVEST_PANEL_TITLE = 'Record reinvestment';
export const WORKFLOW_BH_RECORD_SET_ASIDE_AMOUNT_LABEL = 'Amount';
export const WORKFLOW_BH_RECORD_SET_ASIDE_NOTE_LABEL = 'Note (optional)';
export const WORKFLOW_BH_RECORD_SET_ASIDE_REMAINING_HINT =
  'Remaining for this row';
export const WORKFLOW_BH_VOID_SET_ASIDE_LABEL = 'Void entry';
export const WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_TITLE =
  'Void this set-aside entry?';
export const WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_DESC =
  'The entry stays in history as voided. Recorded totals for this period will update.';
export const WORKFLOW_BH_VOID_SET_ASIDE_CONFIRM = 'Void entry';
/** @deprecated Use {@link WORKFLOW_BH_EXECUTION_TRACKING_HEADING}. */
export const WORKFLOW_BH_STRATEGY_TARGETS_HEADING =
  WORKFLOW_BH_EXECUTION_TRACKING_HEADING;
export const WORKFLOW_BH_STRATEGY_INTRO =
  'Compare strategy targets from your Financial Preferences to what FefeAve has recorded.';
export const WORKFLOW_BH_STRATEGY_UNAVAILABLE =
  'Add a cash snapshot to compare strategy targets to your activity.';
export const WORKFLOW_BH_COL_TARGET = 'Target';
export const WORKFLOW_BH_COL_ACTUAL = 'Actual';
export const WORKFLOW_BH_NOT_TRACKED = 'Not tracked yet';
export const WORKFLOW_BH_TAX_NOT_TRACKED_EXPLAINER =
  'FefeAve does not yet record money set aside for taxes.';
export const WORKFLOW_BH_CASH_ABOVE_BUFFER = 'Cash above buffer';
export const WORKFLOW_BH_CASH_BASED_PAYOUT_LIMIT = 'Cash-based payout limit';
/** @deprecated */
export const WORKFLOW_BH_CASH_BASED_OWNER_LIMIT =
  WORKFLOW_BH_CASH_BASED_PAYOUT_LIMIT;
export const WORKFLOW_BH_LIMIT_NOT_BINDING =
  'Does not limit this week’s payout';
export const WORKFLOW_BH_LIMIT_REDUCED_PAYOUT =
  'This limit reduced the owner payout';
export const WORKFLOW_BH_OWNER_PAYOUT_ROW = 'Owner payout';
export const WORKFLOW_BH_INVENTORY_PURCHASED_LABEL = 'Inventory purchases';
export const WORKFLOW_BH_INVENTORY_PURCHASED_NOTE =
  'Proxy for reinvestment — inventory purchases in the last 30 days, not a reinvestment ledger.';
export const WORKFLOW_BH_PAID_TO_OWNER_THIS_PERIOD =
  'Paid to owner this period';
/** @deprecated */
export const WORKFLOW_BH_OWNER_PAYOUT_ALLOWED = WORKFLOW_BH_OWNER_PAYOUT_ROW;
export const WORKFLOW_BH_REINVEST_ACTUAL_30D =
  WORKFLOW_BH_INVENTORY_PURCHASED_NOTE;
export const WORKFLOW_BH_ACTUALS_DISCLAIMER =
  'Targets come from Financial Preferences and estimated cash. Recorded activity is what FefeAve has in the ledger or owner payout.';
export const WORKFLOW_BH_TAX_TARGET = 'Tax target';
export const WORKFLOW_BH_REINVEST_TARGET = 'Reinvestment target';
export const WORKFLOW_BH_BUFFER_TARGET = 'Cash buffer target';
/** @deprecated */
export const WORKFLOW_BH_RECOMMENDATIONS_HEADING =
  WORKFLOW_BH_STRATEGY_TARGETS_HEADING;
/** @deprecated */
export const WORKFLOW_BH_RECOMMENDATIONS_UNAVAILABLE =
  WORKFLOW_BH_STRATEGY_UNAVAILABLE;
export const WORKFLOW_BH_ESTIMATED_CASH_EXPLAINER_TITLE =
  'How estimated cash is calculated';
export const WORKFLOW_BH_SNAPSHOT_START_LABEL = 'Starting cash snapshot';
export const WORKFLOW_BH_LEDGER_INFLOWS_LINK = 'View inflows in ledger →';
export const WORKFLOW_BH_LEDGER_OUTFLOWS_LINK = 'View outflows in ledger →';
export const WORKFLOW_BH_MANAGE_PREFS = 'Manage Financial Preferences →';
export const WORKFLOW_BH_LINK_INVENTORY = 'View inventory purchases →';
export const WORKFLOW_BH_LINK_EXPENSES = 'View business expenses →';
export const WORKFLOW_BH_LINK_VENDORS = 'View vendors →';

export const WORKFLOW_COMPLETED_THIS_WEEK_LABEL = 'Completed this week';

export const WORKFLOW_DASHBOARD_VENDOR_BALANCES_LABEL = 'Vendor balances';

export const WORKFLOW_DASHBOARD_HERO_PROFIT_LABEL = 'Profit';
export const WORKFLOW_DASHBOARD_HERO_PROFIT_HELPER =
  'Net profit after fees this week';
export const WORKFLOW_DASHBOARD_HERO_VENDOR_HELPER = 'Owed to vendors';
export const WORKFLOW_DASHBOARD_HERO_COMPLETED_LABEL = 'Completed shows';
export const WORKFLOW_DASHBOARD_HERO_COMPLETED_HELPER =
  'Shows completed this week';
export const WORKFLOW_DASHBOARD_HERO_OPEN_LABEL = 'Open shows';
export const WORKFLOW_DASHBOARD_HERO_OPEN_HELPER = 'Needs close-out';
export const WORKFLOW_DASHBOARD_VIEW_VENDORS = 'View vendors';
export const WORKFLOW_DASHBOARD_VIEW_SHOWS = 'View shows';

/** Sidebar identity — single line under wordmark (reseller workspace shell). */
export const WORKFLOW_SIDEBAR_RESELLER_WORKSPACE = 'Reseller Workspace';

export const WORKFLOW_DASHBOARD_PERFECT_WEEK_CALM =
  'All caught up for now — nothing needs your attention.';

export const WORKFLOW_DASHBOARD_WORKSPACE_OVERVIEW_HEADING =
  'Workspace overview';

export const WORKFLOW_DASHBOARD_CARD_SHOWS = 'Shows';
export const WORKFLOW_DASHBOARD_CARD_VENDORS = 'Vendors';
export const WORKFLOW_DASHBOARD_CARD_PURCHASES = 'Purchases';
export const WORKFLOW_DASHBOARD_CARD_BUSINESS_HEALTH = 'Business Health';

export const WORKFLOW_DASHBOARD_VIEW_PURCHASES = 'View purchases';
export const WORKFLOW_DASHBOARD_VIEW_BUSINESS_HEALTH = 'View business health';
/** @deprecated Prefer {@link WORKFLOW_DASHBOARD_VIEW_BUSINESS_HEALTH}. */
export const WORKFLOW_DASHBOARD_OPEN_BUSINESS_HEALTH =
  WORKFLOW_DASHBOARD_VIEW_BUSINESS_HEALTH;

export const WORKFLOW_DASHBOARD_SHOWS_NEXT_LABEL = 'Next show';
export const WORKFLOW_DASHBOARD_SHOWS_LAST_COMPLETED_LABEL =
  'Last completed this week';
export const WORKFLOW_DASHBOARD_SHOWS_NO_NEXT = 'Nothing scheduled yet';
export const WORKFLOW_DASHBOARD_SHOWS_NO_COMPLETED_WEEK =
  'No completed shows this week';

export const WORKFLOW_DASHBOARD_VENDORS_OWED_LABEL = 'Vendors owed';
export const WORKFLOW_DASHBOARD_VENDORS_LARGEST_LABEL = 'Largest balance';
export const WORKFLOW_DASHBOARD_VENDORS_RECENT_PAYMENT_LABEL = 'Recent payment';
export const WORKFLOW_DASHBOARD_VENDORS_NONE_OWING = 'None owing';
export const WORKFLOW_DASHBOARD_VENDORS_NO_PAYMENTS =
  'No payments recorded yet';

export const WORKFLOW_DASHBOARD_PURCHASES_EXPENSES_30D =
  'Business expenses (30d)';
export const WORKFLOW_DASHBOARD_PURCHASES_RECENT_LABEL = 'Recent activity';
export const WORKFLOW_DASHBOARD_PURCHASES_NO_RECENT =
  'No purchases or expenses in the last 30 days';

export const WORKFLOW_DASHBOARD_BH_UNAVAILABLE =
  'Close a show this week to unlock period plan.';

export const WORKFLOW_DASHBOARD_TREND_PROFIT_LABEL = 'Profit this month (MTD)';
export const WORKFLOW_DASHBOARD_TREND_SHOWS_LABEL = 'Total shows this month';
export const WORKFLOW_DASHBOARD_TREND_VENDOR_LABEL =
  'Total outstanding to vendors';

export const WORKFLOW_DASHBOARD_TREND_PROFIT_HELPER =
  'Net profit from closed shows this month';
export const WORKFLOW_DASHBOARD_TREND_SHOWS_HELPER =
  'Completed shows dated this month';
export const WORKFLOW_DASHBOARD_TREND_VENDOR_HELPER =
  'Current vendor liability snapshot';

export const WORKFLOW_DASHBOARD_TREND_NO_PRIOR_PROFIT =
  'No profit in prior month to compare';

export const WORKFLOW_DASHBOARD_DATE_UNAVAILABLE = 'Date not available';

export const WORKFLOW_QUICK_ACTION_RECORD_EXPENSE = 'Record expense';

export const WORKFLOW_QUICK_ACTION_RECORD_INVENTORY =
  'Record inventory purchase';

export const WORKFLOW_QUICK_ACTION_PAY_VENDOR = 'Pay vendor';

export const WORKFLOW_ACTIVE_SHOWS_ROW_LABEL = 'Shows still open';

export const WORKFLOW_VENDORS_WITH_BALANCE_ROW_LABEL = 'Vendors with a balance';

/** Dashboard Needs attention — dollar-first liability row. */
export const WORKFLOW_OUTSTANDING_BALANCES_ROW_LABEL = 'Outstanding balances';

/** Vendors index */
export const WORKFLOW_VENDORS_PAGE_SUBTITLE =
  'Manage vendor balances, ledger, and payments.';

/** Vendors index toolbar — opens Full Ledger filtered to payment events. */
export const WORKFLOW_VENDORS_PAYMENT_LEDGER_LINK = 'Payment Ledger';

/** Vendor detail — embedded ledger from financial events (settlements + payments). */
export const WORKFLOW_VENDOR_LEDGER_HEADING = 'Vendor Ledger';
export const WORKFLOW_VENDOR_LEDGER_SUBTITLE =
  'Chronological ledger events for this vendor.';

/** Vendor detail — link to full Ledger scoped to this vendor. */
export const WORKFLOW_VENDOR_VIEW_FULL_LEDGER = 'View full Ledger';

/** Vendor detail — balance summary stat hints */
export const WORKFLOW_VENDOR_DETAIL_BALANCE_CURRENT_HINT =
  'Total owed minus total paid.';
export const WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_OWED_HINT =
  'All obligations recorded for this vendor.';
export const WORKFLOW_VENDOR_DETAIL_BALANCE_TOTAL_PAID_HINT =
  'All payments recorded to this vendor.';

/** Vendors index — header primary action */
export const WORKFLOW_NEW_VENDOR_TRIGGER_LABEL = 'New vendor';
export const WORKFLOW_NEW_VENDOR_PANEL_TITLE = 'New vendor';
export const WORKFLOW_NEW_VENDOR_PANEL_SUBTITLE =
  'Create a vendor record for balances, payments, and ledger.';
export const WORKFLOW_NEW_VENDOR_NAME_LABEL = 'Vendor name';
export const WORKFLOW_NEW_VENDOR_FORM_SUBMIT_LABEL = 'Create vendor';

/** Vendors index — account lifecycle filter */
export const WORKFLOW_VENDORS_STATUS_ACTIVE = 'Active';
export const WORKFLOW_VENDORS_STATUS_ARCHIVED = 'Archived';
export const WORKFLOW_VENDORS_STATUS_ALL = 'All vendors';

/** Transitional link to legacy People & Accounts (pre-removal). */
export const WORKFLOW_VENDORS_ADVANCED_ACCOUNT_SETTINGS =
  'Advanced account settings';

/** @deprecated People & Accounts is transitional — prefer Vendors for vendor setup. */
export const WORKFLOW_SETTINGS_ACCOUNTS_DEPRECATED_NOTE =
  'Vendor setup and directory live on Vendors. This page remains for transitional account administration until profile and portal tools move to vendor detail.';

/** Vendors index — obligation strip */
export const WORKFLOW_VENDORS_OUTSTANDING_LABEL = 'Outstanding';
export const WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL = 'Vendors owing';
export const WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL = 'Total owed';
export const WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL = 'Total paid';

/** Vendors index — payment view segments */
export const WORKFLOW_VENDORS_VIEW_NEEDS_PAYMENT = 'Needs payment';
export const WORKFLOW_VENDORS_VIEW_PARTIALLY_PAID = 'Partially paid';
export const WORKFLOW_VENDORS_VIEW_ALL_VENDORS = 'All vendors';

/** Vendors index — xl+ operational rail */
export function workflowVendorLastPaidLabel(iso: string): string {
  const label = new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `Last paid ${label}`;
}
export const WORKFLOW_VENDORS_RAIL_RECENT_ACTIVITY_HEADING = 'Recent payments';
export const WORKFLOW_VENDORS_RAIL_RECORD_PAYMENT = 'Record payment';
export const WORKFLOW_VENDORS_RAIL_NO_RECENT_PAYMENTS =
  'No vendor payments recorded yet.';

/** Vendor charges — ledger correction on Vendor Detail; rare create via advanced flow. */
export const WORKFLOW_VENDOR_CHARGE_SECTION_TITLE = 'Record vendor obligation';
export const WORKFLOW_VENDOR_CHARGE_EDIT_TITLE = 'Edit vendor charge';
export const WORKFLOW_VENDOR_CHARGE_SUBMIT_LABEL = 'Record obligation';
export const WORKFLOW_VENDOR_CHARGE_DESCRIPTION_PLACEHOLDER =
  'e.g. Freight, handling fee, restocking fee';
export const WORKFLOW_VENDOR_CHARGE_SCOPE =
  'Increases what you owe this vendor. Cash moves when you record a payment.';
export const WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_TOGGLE =
  'Record vendor obligation (advanced)';
export const WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_HELP =
  'Rare fees not tied to inventory or a show. Prefer inventory purchases or show close-out when possible.';
/** @deprecated Removed from Vendor Detail primary CTAs — use advanced obligation flow. */
export const WORKFLOW_VENDOR_DETAIL_RECORD_CHARGE_CTA =
  WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_TOGGLE;
/** @deprecated */
export const WORKFLOW_VENDOR_DETAIL_RECORD_CHARGE_HELP =
  WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_HELP;
export const WORKFLOW_VENDOR_CHARGE_INVENTORY_GUIDANCE =
  'Buying inventory or stock? Record an inventory purchase under Purchases so inventory and this vendor balance stay linked.';
export const WORKFLOW_VENDOR_CHARGE_RECORD_INVENTORY_LINK =
  'Record inventory purchase';

export const WORKFLOW_EMPTY_VENDORS_NEEDS_PAYMENT_TITLE =
  'No vendors need payment right now.';
export const WORKFLOW_EMPTY_VENDORS_NEEDS_PAYMENT_HINT =
  'When a vendor has an outstanding balance, they will appear here.';

export const WORKFLOW_EMPTY_VENDORS_PARTIALLY_PAID_TITLE =
  'No partially paid vendors.';
export const WORKFLOW_EMPTY_VENDORS_PARTIALLY_PAID_HINT =
  'Vendors with some payments applied but a remaining balance appear here.';

export const WORKFLOW_EMPTY_VENDORS_FILTERED_TITLE =
  'No vendors match this view.';
export const WORKFLOW_EMPTY_VENDORS_FILTERED_HINT =
  'Try another view or clear your search.';

/** Purchases index */
export const WORKFLOW_PURCHASES_TAB_INVENTORY_LABEL = 'Inventory purchases';
export const WORKFLOW_PURCHASES_PAGE_SUBTITLE =
  'Record inventory purchases and business expenses.';
export const WORKFLOW_PURCHASES_TAB_EXPENSES_LABEL = 'Expenses';
export const WORKFLOW_PURCHASES_TAB_INVENTORY_HELPER =
  'Use Inventory purchases for pallets, lots, and vendor buys. Choose “Owe vendor” when you have not paid yet.';
export const WORKFLOW_PURCHASES_TAB_EXPENSES_HELPER =
  'Use Expenses for business costs paid now that do not create vendor balance.';
/** @deprecated Vendor charges tab removed from Purchases. */
export const WORKFLOW_PURCHASES_TAB_VENDOR_CHARGES_LABEL = 'Vendor charges';
/** @deprecated */
export const WORKFLOW_PURCHASES_RECORD_VENDOR_CHARGE_LABEL =
  'Record vendor charge';
/** @deprecated */
export const WORKFLOW_PURCHASES_RECORD_VENDOR_CHARGE_PANEL_TITLE =
  'Record vendor charge';
export const WORKFLOW_PURCHASES_RECORD_INVENTORY_LABEL =
  'Record inventory purchase';
export const WORKFLOW_PURCHASES_RECORD_EXPENSE_LABEL = 'Record expense';
export const WORKFLOW_PURCHASES_RECORD_PURCHASE_LABEL = 'Record purchase';
export const WORKFLOW_PURCHASES_RECORD_PURCHASE_PANEL_TITLE = 'Record purchase';
export const WORKFLOW_PURCHASES_RECORD_TYPE_INVENTORY_LABEL =
  'Inventory purchase';
export const WORKFLOW_PURCHASES_RECORD_TYPE_EXPENSE_LABEL = 'Business expense';
export const WORKFLOW_PURCHASES_RECORD_TYPE_FIELD_LABEL = 'Purchase type';
export const WORKFLOW_PURCHASES_RECORD_INVENTORY_PANEL_TITLE =
  'Record inventory purchase';
export const WORKFLOW_PURCHASES_INVENTORY_RECENT_TITLE =
  'Recent inventory purchases (last 30 days)';
export function workflowPurchasesInventorySummaryLabel(days: number): string {
  return `Inventory purchases (${days}d)`;
}
export const WORKFLOW_DASHBOARD_INVENTORY_30D_LABEL =
  'Inventory purchases (30d)';
export const WORKFLOW_LEDGER_CATEGORY_INVENTORY = 'Inventory purchases';
export const WORKFLOW_PURCHASES_PAYMENT_PAID_NOW = 'Paid now';
export const WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR = 'Owe vendor';
export const WORKFLOW_PURCHASES_VENDOR_REQUIRED =
  'Select a vendor when you owe them.';
export const WORKFLOW_PURCHASES_VENDOR_CHARGE_SELECT_HINT =
  'Select a vendor to record a vendor charge.';
export const WORKFLOW_PURCHASES_RECORD_EXPENSE_PANEL_TITLE = 'Record expense';

export const WORKFLOW_EMPTY_PAYMENTS_TITLE = 'No payments recorded yet.';
export const WORKFLOW_EMPTY_PAYMENTS_HINT =
  'Record a payment to reduce a vendor balance.';

export const WORKFLOW_EMPTY_BALANCES_TITLE = 'No vendor balances yet.';
export const WORKFLOW_EMPTY_BALANCES_HINT =
  'Balances appear after you close a show with settlements.';

export const WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_TITLE =
  'No vendor accounts found.';
export const WORKFLOW_EMPTY_ACCOUNTS_WHOLESALER_HINT =
  'Add a vendor account to track payouts and balances.';

export const WORKFLOW_EMPTY_ACCOUNTS_OWNER_TITLE = 'No owner account found.';
export const WORKFLOW_EMPTY_ACCOUNTS_OWNER_HINT =
  'Set up the owner account to record weekly self-pay.';

export const WORKFLOW_OWNER_RECORD_PAYOUT_LABEL = 'Record owner payout';

export const WORKFLOW_OWNER_USING_STRATEGY_PREFIX = 'Using';
export const WORKFLOW_OWNER_USING_STRATEGY_SUFFIX = 'strategy';

export const WORKFLOW_OWNER_DRAW_STATUS_UNAVAILABLE = 'Unavailable';
export const WORKFLOW_OWNER_DRAW_STATUS_UNPAID = 'Unpaid';
export const WORKFLOW_OWNER_DRAW_STATUS_PARTIALLY_PAID = 'Partially paid';
export const WORKFLOW_OWNER_DRAW_STATUS_PAID = 'Paid';
export const WORKFLOW_OWNER_DRAW_STATUS_VOIDED = 'Voided';

export const WORKFLOW_SHOWS_OPEN_BUSINESS_HEALTH = 'Open Business Health';

export const WORKFLOW_VENDORS_BALANCE_BY_SHOW_HEADING = 'Balance by show';
export const WORKFLOW_VENDORS_BALANCE_BY_SHOW_SUBTITLE =
  'Shows that currently contribute to this vendor’s balance.';
export const WORKFLOW_VENDORS_BALANCE_BY_SHOW_JUMP_LINK = 'Balance by show';
/** @deprecated In-page jump removed when section is visible on vendor detail. Kept for external deep links. */
export const WORKFLOW_VENDORS_BALANCE_BY_SHOW_RECORD_PAYMENT = 'Record payment';
export const WORKFLOW_VENDORS_BALANCE_BY_SHOW_NON_SHOW_NOTE =
  'Current balance also includes vendor charges or other obligations not tied to a closed show. Those amounts are not listed below.';

/** @deprecated Use {@link WORKFLOW_VENDORS_BALANCE_BY_SHOW_JUMP_LINK}. */
export const WORKFLOW_VENDORS_BALANCE_BREAKDOWN_LINK =
  WORKFLOW_VENDORS_BALANCE_BY_SHOW_JUMP_LINK;

export const WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_TITLE =
  'No closed shows contribute to this balance.';
export const WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_HINT =
  'Non-show obligations appear in Vendor Ledger below.';

export const WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_TITLE =
  'No closed shows in the selected pay window.';
export const WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_HINT =
  'Try a wider pay window or choose All.';

/** @deprecated Use balance-by-show empty-state constants. */
export const WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_TITLE =
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_TITLE;
/** @deprecated Use balance-by-show empty-state constants. */
export const WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_HINT =
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_NO_SHOWS_HINT;
/** @deprecated Use balance-by-show empty-state constants. */
export const WORKFLOW_EMPTY_BATCH_PAY_FILTERED_TITLE =
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_TITLE;
/** @deprecated Use balance-by-show empty-state constants. */
export const WORKFLOW_EMPTY_BATCH_PAY_FILTERED_HINT =
  WORKFLOW_EMPTY_BALANCE_BY_SHOW_FILTERED_HINT;

export const WORKFLOW_OWNER_HISTORY_HEADING = 'Payout history';
export const WORKFLOW_OWNER_HISTORY_SUBTITLE =
  'Prior periods — expand a row to see which shows were included.';

export const WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_LABEL = 'This period';
export const WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_NOTE =
  'Tracked in This Period Plan above. Prior periods are listed below.';
export const WORKFLOW_OWNER_HISTORY_VIEW_LEDGER =
  'View owner payout in ledger →';
export const WORKFLOW_OWNER_HISTORY_RECORDED = 'Recorded';
export const WORKFLOW_OWNER_HISTORY_PAID_TO_OWNER = 'Paid to owner';
export function workflowPaidToOwnerOnDate(dateLabel: string): string {
  return `Paid to owner ${dateLabel}`;
}

export const WORKFLOW_EMPTY_OWNER_ACTIVITY_TITLE =
  'No prior period payouts yet.';
export const WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT =
  'When you record payouts in earlier weeks, they will appear here.';
export const WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT_WITH_CURRENT =
  'This period’s payout is tracked in This Period Plan above.';

export const WORKFLOW_EMPTY_INVENTORY_TITLE =
  'No inventory purchases in the last 30 days.';
export const WORKFLOW_EMPTY_INVENTORY_HINT =
  'Record pallets, lots, and vendor buys. Choose Owe vendor when you have not paid yet.';

export const WORKFLOW_EMPTY_EXPENSES_TITLE =
  'No business expenses in the last 30 days.';
export const WORKFLOW_EMPTY_EXPENSES_HINT =
  'Record business costs paid now that do not create vendor balance.';

export const WORKFLOW_EMPTY_SHOWS_TITLE = 'No shows yet.';
export const WORKFLOW_EMPTY_SHOWS_HINT =
  'Log your first show to start tracking payouts and settlements.';
