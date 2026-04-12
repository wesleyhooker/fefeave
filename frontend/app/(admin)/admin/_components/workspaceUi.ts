/**
 * Admin workspace — source of truth for neutral chrome + semantics.
 * **Interaction reference:** the dashboard (`/admin/dashboard`) — match its row hover, title links,
 * action chip sizes, and money treatment when building new admin lists or tables.
 *
 * ## Where things live (do not duplicate ad hoc Tailwind for these concerns)
 *
 * | Concern | Home |
 * |---------|------|
 * | Shell, cards, panels, table chrome, section headers | This file (`workspaceUi.ts`) |
 * | Money tone on values (positive / liability / neutral) | This file — `workspaceMoney*` + helpers |
 * | Action meaning + size (primary, Pay, Close out, row vs page) | This file — `workspaceAction*` |
 * | Row hover + title link pattern | This file — `workspaceTableRowInteractive`, `workspaceRowTitleLink` |
 * | Show Open/Closed pill (list + header) | `ShowStatusPill.tsx` + `workspaceShowStatus*` here |
 * | Vendor payment state (Unpaid / Partially paid / Paid) | `WorkspaceListPaymentStatus` + `getWorkspacePaymentStatus` in `_lib/workspacePaymentStatus.ts` |
 * | Show detail settlement rollup (Open/Paid/Unpaid) | This file — `workspaceDetailSettlement*` |
 * | Workspace shadows | `tailwind.config.ts` — `shadow-workspace-surface*` |
 * | Sidebar/header/menu hover + active | This file — `workspaceChromeHover` (+ `workspaceChromeTransition`) |
 * | Loading skeletons shaped like admin pages | `AdminPageSkeletons.tsx` |
 * | Page region stacks/grids (intro-adjacent, primary/secondary columns) | `_lib/workspacePageRegions.ts` |
 * | Summary stat tiles (dashboard-style cards) | `AdminSummaryStatGrid.tsx` + `workspaceStatTile` |
 * | Section toolbar (filters left, actions right) | `AdminWorkspaceToolbar.tsx` + `workspaceSectionToolbar` |
 *
 * ## Row interaction model
 * - **Primary navigation:** link on the entity name/title (`workspaceRowTitleLink`). Shows desktop table uses
 *   row hover (`workspaceTableRowInteractive`) plus a **show-column link**; optional full-row anchor pattern
 *   lives in `workspaceShowsTableRowLink` for special cases.
 * - **Inline actions:** use `workspaceAction*Sm`; if the row ever gets an `onClick`, call `e.stopPropagation()` on action controls.
 * - **Discoverability:** put `workspaceTableRowInteractive` on `<tr>`, `<li>`, or card rows; for full-row links the hover/focus lives on the anchor.
 *
 * ## Money in lists
 * One semantically colored amount per row when possible (e.g. profit); add a second line only when needed (e.g. owed > 0). Full payout/settlement breakdown belongs in detail views.
 *
 * Shadows: `shadow-workspace-surface` / `shadow-workspace-surface-sm` (tailwind.config).
 */

/** Page / shell — neutral light gray so white cards read clearly above it. */
export const workspaceShellBg = 'bg-[#F3F4F6]';

/**
 * Main column (header + content): single left rule on md+ so the seam with the
 * sidebar is one deliberate edge (pairs with header border-b at the junction).
 */
export const workspaceShellColumn =
  'flex min-w-0 flex-1 flex-col md:border-l md:border-gray-200';

/** Transitions for workspace chrome — restrained, no bouncy motion */
export const workspaceChromeTransition =
  'transition-[color,background-color] duration-200 ease-out';

/**
 * Slightly stronger than gray-100 on white chrome (sidebar, header, menus).
 */
export const workspaceChromeHover = `${workspaceChromeTransition} hover:bg-gray-200/55 active:bg-gray-300/35`;
export const workspaceChromeHoverWarm = `${workspaceChromeTransition} hover:bg-stone-200/45 active:bg-stone-300/30`;

/**
 * Lighter inset band on the shell (filters, totals). Steps up toward white
 * without matching card white.
 */
export const workspaceMutedStrip = 'bg-[#F9FAFB]';

/** White card / panel with clear separation from the shell */
export const workspaceCard =
  'rounded-lg border border-gray-200 bg-white shadow-workspace-surface';

/** Bordered white surface with a lighter lift (nested blocks) */
export const workspacePanel =
  'rounded-lg border border-gray-200 bg-white shadow-workspace-surface-sm';

/** Header row inside a card-style block */
export const workspaceCardHeader =
  'border-b border-gray-200 bg-gray-50/50 px-4 py-3';

/**
 * Toolbar strip for a section title + right-side links (matches dashboard “Shows this week” bar).
 */
export const workspaceSectionToolbar =
  'flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/40 px-4 py-3';

/** Page-level H1 */
export const workspacePageTitle = 'text-2xl font-semibold text-gray-900';

/** Subtitle / context under page title (e.g. week range) */
export const workspacePageMeta = 'mt-1 text-sm text-gray-600';

// --- Page intro strip (soft boutique workspace) -------------------------------

/** Shared page-content width for admin pages (aligns intro + cards). */
export const workspacePageContentWidth = 'w-full max-w-5xl xl:max-w-6xl';

/**
 * Wider main column for dense operational pages (e.g. Shows).
 * Keeps gutters; does not go full-bleed.
 */
export const workspacePageContentWidthWide =
  'w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[min(92rem,calc(100vw-3rem))]';

/** Standard page gutters inside the admin main area. */
export const workspacePageGutter = 'px-4 md:px-6';

/** Shared admin page stack rhythm under intro zone. */
export const workspacePageContentStack = 'flex flex-col gap-6 md:gap-7';

/** Single owner of spacing between intro zone and the first content row. */
export const workspacePageIntroToContentGap = 'pt-2 md:pt-2.5';

/**
 * Reusable workspace page-intro zone (page layer, not a content card).
 * No radius/shadow/panel border; this is page framing under the workspace top nav.
 */
export const workspacePageIntroZone =
  'relative overflow-hidden bg-[rgba(250,247,246,0.85)] after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-stone-200/70';

/**
 * Flatter intro strip for nested entity pages (e.g. wholesaler under Balances) — less “landing page” wash.
 */
export const workspacePageEntityIntroZone =
  'relative overflow-hidden bg-white after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-stone-200/70';

/** Vertical rhythm inside intro zone; horizontal rhythm comes from main layout padding. */
export const workspacePageIntroZoneInner = 'relative';

/** Optional left accent rail for intro text block. */
export const workspacePageIntroAccent =
  'border-l-[3px] border-rose-400/60 pl-3.5 sm:pl-4';

/** In-card section H2 */
export const workspaceSectionTitle =
  'text-base font-semibold tracking-tight text-gray-900';

/** Uppercase label above a metric or block */
export const workspaceLabelEyebrow =
  'text-[11px] font-medium uppercase tracking-wider text-gray-500';

/**
 * Summary stat tile — matches dashboard overview cards (warm stone border, soft lift).
 * Use with `workspaceStatEyebrow` and `AdminSummaryStatGrid`.
 */
export const workspaceStatTile =
  'flex min-h-[7.75rem] flex-col rounded-xl border border-stone-200/80 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(120,113,108,0.06)] sm:min-h-[8rem] sm:px-5 sm:py-5';

/** Eyebrow label inside summary stat tiles (aligned with dashboard overview). */
export const workspaceStatEyebrow =
  'text-[11px] font-semibold uppercase tracking-wider text-stone-500';

/**
 * Toolbar search field — height aligned with `workspaceActionSecondaryMd` row actions.
 */
export const workspaceToolbarSearchInput =
  'h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900';

/** Checkbox + label row in admin toolbars (filters). */
export const workspaceToolbarFilterLabel =
  'flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700';

/** Secondary numeric / meta cells in admin data tables */
export const workspaceTableCellSecondary = 'text-sm tabular-nums text-gray-600';

/** Secondary text (non-numeric) in admin table cells */
export const workspaceTableCellMeta = 'text-sm text-gray-600';

/**
 * **Panel:** `workspaceCard` / `workspacePanel` — bordered, lifted surface for grouped content.
 * **Flat list:** `workspaceInsetFlatList` — `divide-y` only, inside a card (no nested white panel).
 */
export const workspaceInsetFlatList = 'divide-y divide-gray-100';

/** Table: row dividers */
export const workspaceTableDivide = 'divide-y divide-gray-100';

/** Table head: sticky bar aligned with shell tone */
export const workspaceTheadSticky = 'sticky top-0 z-10 bg-[#F3F4F6]';

/** Interactive table body row — clearer hover, still neutral */
export const workspaceTableRowHover =
  'transition-colors duration-200 ease-out hover:bg-gray-200/45';

/**
 * Same as `workspaceTableRowHover` — use on any row you want to feel “interactive”
 * (tables, divided lists, dashboard rows).
 */
export const workspaceTableRowInteractive = workspaceTableRowHover;

/**
 * Full-width row `<Link>` inside a single `<td colSpan={…}>` — same interaction idea as
 * dashboard list rows (`dashboardClickableRowInner`): strong hover, inset rail, focus ring.
 * Use with `group/shows-nav` for chevron motion. Chevron is decorative (`aria-hidden`); label the link.
 */
export const workspaceShowsTableRowLink =
  'group/shows-nav relative flex w-full min-h-11 min-w-0 items-center gap-3 px-4 py-2.5 text-left text-inherit no-underline outline-none transition-[background-color,box-shadow] duration-200 ease-out hover:bg-gray-100/90 hover:shadow-[0_4px_14px_-4px_rgba(17,24,39,0.06),inset_3px_0_0_0_rgba(75,85,99,0.14)] active:bg-gray-100/95 focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/** Pair with `workspaceShowsTableRowLink` when the parent `<tr>` uses today (sky) emphasis. */
export const workspaceShowsTableRowLinkToday =
  'hover:bg-sky-100/90 hover:shadow-[0_4px_14px_-4px_rgba(14,165,233,0.08),inset_3px_0_0_0_rgba(56,189,248,0.32)] active:bg-sky-100/95';

/**
 * Primary navigation target in a row (show/vendor name → detail).
 * Pair with `workspaceTableRowInteractive` on the parent row when appropriate.
 */
export const workspaceRowTitleLink =
  'font-medium text-gray-900 hover:text-gray-600 hover:underline';

// --- Semantic money (value carries meaning; avoid loud green/red) ------------

/** Tabular figures for currency */
export const workspaceMoneyTabular = 'tabular-nums';

/**
 * Profit / positive signed amounts — muted emerald (not bright success green).
 */
export const workspaceMoneyPositive = 'text-emerald-800';

/**
 * Loss, negative signed amounts, liability emphasis — muted rose.
 */
export const workspaceMoneyNegative = 'text-rose-800/90';

/** Zero or ordinary amount in a neutral context */
export const workspaceMoneyNeutral = 'text-gray-900';

/** Placeholder / unknown */
export const workspaceMoneyMuted = 'text-gray-400';

/**
 * Signed economic value (e.g. profit). Null/NaN → muted.
 */
export function workspaceMoneyClassForSigned(value: number | null): string {
  if (value === null || Number.isNaN(value)) return workspaceMoneyMuted;
  if (value > 0) return workspaceMoneyPositive;
  if (value < 0) return workspaceMoneyNegative;
  return workspaceMoneyNeutral;
}

/**
 * Outstanding liability (owed / balance): >0 → muted danger; else subdued gray.
 */
export function workspaceMoneyClassForLiability(value: number): string {
  if (value > 0) return `${workspaceMoneyNegative} font-medium`;
  return 'text-gray-500';
}

/**
 * List / table rows: one primary money line — label neutral, amount semantic.
 * Pass signed profit-style values; combine with `workspaceMoneyTabular` + font-semibold as needed.
 */
export function workspaceListPrimaryMoneyAmountClass(
  value: number | null,
): string {
  return `${workspaceMoneyTabular} font-semibold ${workspaceMoneyClassForSigned(value)}`;
}

// --- Actions (meaning + size) -------------------------------------------------

const focusRingDark =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

const focusRingSoft =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400';

/**
 * Primary page/section action — e.g. + Show (filled dark).
 */
export const workspaceActionPrimaryMd = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 active:bg-gray-950 ${focusRingDark}`;

/**
 * Secondary page/section action — Record payment in header, supporting flows (outline).
 */
export const workspaceActionSecondaryMd = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 ${focusRingSoft}`;

/**
 * Completion workflow — Close out, Mark done (row / compact).
 */
export const workspaceActionCompleteSm = `inline-flex items-center justify-center rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-800 ${focusRingDark}`;

/**
 * Completion workflow — section-level (e.g. show detail close out).
 */
export const workspaceActionCompleteMd = `inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingDark}`;

/**
 * Neutral row follow-up — View, Cancel-style outline.
 */
export const workspaceActionSecondarySm = `inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 ${focusRingSoft}`;

/**
 * Financial / money-out — Pay (distinct from completion; restrained amber field).
 */
export const workspaceActionFinancialSm = `inline-flex items-center justify-center rounded-md border border-amber-200/90 bg-amber-50/40 px-2.5 py-1 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:border-amber-300/90 hover:bg-amber-50/70 ${focusRingSoft}`;

/**
 * Tertiary navigation chip — All shows, Balances, footer links.
 */
export const workspaceActionTertiaryLink = `inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 ${focusRingSoft}`;

/**
 * Record payment on balance/vendor rows (secondary bucket; not Pay label).
 */
export const workspaceActionRecordPaymentSm = workspaceActionSecondarySm;

/** Warm primary action for meaningful workspace confirms (e.g. mark paid). */
export const workspaceActionWarmPrimaryMd =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(190,24,93,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-rose-700 hover:shadow-[0_2px_8px_-2px_rgba(190,24,93,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/50 active:bg-rose-800';

/** Subtle outline action for confirm/cancel dialogs and secondary controls. */
export const workspaceActionQuietOutlineMd =
  'inline-flex items-center justify-center rounded-xl border border-stone-200/95 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 shadow-[0_1px_2px_rgba(120,113,108,0.04)] transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/40';

/** @deprecated Use workspaceActionPrimaryMd */
export const workspaceBtnPrimary = workspaceActionPrimaryMd;

/** @deprecated Use workspaceActionSecondaryMd */
export const workspaceBtnSecondary = workspaceActionSecondaryMd;

// --- Show list status (Open / Closed) ----------------------------------------

export const workspaceShowStatusPillClosed =
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-emerald-200/80 sm:gap-1.5 sm:px-2 sm:py-0.5 sm:text-xs bg-emerald-50/90 text-emerald-800';

export const workspaceShowStatusPillOpen =
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-blue-200/80 sm:gap-1.5 sm:px-2 sm:py-0.5 sm:text-xs bg-blue-50/90 text-blue-800';

export const workspaceShowStatusDotClosed =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/80';

export const workspaceShowStatusDotOpen =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600/80';

export const workspaceShowStatusPillPlanned =
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-violet-200/85 sm:gap-1.5 sm:px-2 sm:py-0.5 sm:text-xs bg-violet-50/90 text-violet-900';

export const workspaceShowStatusDotPlanned =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600/75';

/**
 * Shows **desktop table** status column — dot + label, no chip ring (see `ShowsTableStatus`).
 * Stays readable on row hover (`gray-100`) without button-like affordance.
 */
export const workspaceShowsTableStatusLabelOpen = 'text-gray-800';
export const workspaceShowsTableStatusLabelClosed = 'text-gray-600';
export const workspaceShowsTableStatusDotOpen =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/85';
export const workspaceShowsTableStatusDotClosed =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/70';

/** Planned / scheduled — distinct from open (amber) and closed (emerald). */
export const workspaceShowsTableStatusLabelPlanned = 'text-gray-800';
export const workspaceShowsTableStatusDotPlanned =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/85';

/** Fallback / unknown API status — still show a deliberate dot. */
export const workspaceShowsTableStatusLabelOther = 'text-gray-600';
export const workspaceShowsTableStatusDotOther =
  'h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400/95';

// --- Show detail — settlement rollup badge (Open / Paid / Unpaid) ------------

export const workspaceDetailSettlementOpen =
  'border border-gray-200/90 bg-gray-50 text-gray-800';

export const workspaceDetailSettlementPaid =
  'border border-emerald-200/80 bg-emerald-50/90 text-emerald-800';

export const workspaceDetailSettlementUnpaid =
  'border border-amber-200/80 bg-amber-50 text-gray-900';

export const workspaceDetailSettlementDotOpen = 'bg-gray-400';
export const workspaceDetailSettlementDotPaid = 'bg-emerald-600/80';
export const workspaceDetailSettlementDotUnpaid = 'bg-amber-500/80';

export const WORKSPACE_DETAIL_SETTLEMENT_STATUS_STYLES: Record<string, string> =
  {
    Open: workspaceDetailSettlementOpen,
    Paid: workspaceDetailSettlementPaid,
    Unpaid: workspaceDetailSettlementUnpaid,
  };

export const WORKSPACE_DETAIL_SETTLEMENT_STATUS_DOTS: Record<string, string> = {
  Open: workspaceDetailSettlementDotOpen,
  Paid: workspaceDetailSettlementDotPaid,
  Unpaid: workspaceDetailSettlementDotUnpaid,
};
