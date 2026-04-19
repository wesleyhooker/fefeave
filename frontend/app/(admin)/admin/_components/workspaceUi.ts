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
 * | Styled native `<select>` / text / date | `workspaceSelect`, `workspaceTextInput`, `workspaceDateInput` + `WorkspaceNativeSelect.tsx` |
 * | Segmented toolbar filter | `workspaceSegmentedTrack` / `workspaceSegmentedButton*` + `WorkspaceSegmentedControl.tsx` |
 * | Toolbar Export / Actions menu | `WorkspaceToolbarMenu.tsx` (+ `workspaceToolbarMenuPanel` / `workspaceToolbarMenuItem*`) |
 * | Single-select menu (form fields, same family as toolbar menus) | `WorkspaceSelectMenu.tsx` |
 * | File upload (form attachment row) | `WorkspaceFileUpload.tsx` |
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

/**
 * Shared field chrome for native text, select, and date inputs (aligned height + border).
 */
const workspaceFormFieldChrome =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 shadow-sm outline-none transition-[border-color,box-shadow] hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60';

/** Standard single-line text / amount fields (not `<select>`). */
export const workspaceTextInput = `h-10 px-3 ${workspaceFormFieldChrome}`;

/** Compact fields (dense forms, e.g. vendor inline pay). */
export const workspaceTextInputCompact = `h-9 px-2.5 ${workspaceFormFieldChrome}`;

/**
 * Native `<select>` — pair with {@link WorkspaceNativeSelect} for chevron affordance.
 */
export const workspaceSelect = `h-10 cursor-pointer appearance-none px-3 pr-10 ${workspaceFormFieldChrome}`;

/**
 * Native `<input type="date">` — calendar chrome stays browser-native; field matches other controls.
 */
export const workspaceDateInput = `${workspaceTextInput} [color-scheme:light]`;

export const workspaceDateInputCompact = `${workspaceTextInputCompact} [color-scheme:light]`;

/** Segmented filter track (toolbar / compact filters). */
export const workspaceSegmentedTrack =
  'flex w-full min-w-0 rounded-lg border border-gray-200/95 bg-gray-100/70 p-0.5 shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)]';

/** Inactive segment in {@link workspaceSegmentedTrack}. */
export const workspaceSegmentedButton =
  'flex-1 min-w-0 justify-center rounded-md px-2 py-1.5 text-center text-xs font-medium text-gray-500 antialiased transition-[color,background-color,box-shadow] duration-150 hover:bg-white/45 hover:text-gray-800 sm:px-3 sm:py-2 sm:text-sm';

/** Active segment — inset chip. */
export const workspaceSegmentedButtonActive =
  'bg-white/95 font-medium text-gray-900 shadow-[0_1px_1px_rgba(15,23,42,0.05)]';

/** Toolbar dropdown panel (Export / Filter / Download) — shared surface. */
export const workspaceToolbarMenuPanel =
  'absolute z-40 mt-1.5 min-w-[12.5rem] rounded-xl border border-gray-200/95 bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.16),0_4px_14px_-6px_rgba(15,23,42,0.08)] ring-1 ring-gray-900/[0.04]';

/** Menu row — text + hover; pair with {@link workspaceToolbarMenuItemSelected}. */
export const workspaceToolbarMenuItem =
  'flex w-full min-h-[2.5rem] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-400/80';

/** Selected row in filter-style menus. */
export const workspaceToolbarMenuItemSelected =
  'bg-stone-50/90 font-medium text-gray-900';

/** Unified form label (primary fields). */
export const workspaceFormLabel = 'text-sm font-medium text-gray-800';

/** Secondary tier label (reference, date, receipt) — same size, softer tone. */
export const workspaceFormLabelSecondary = 'text-sm font-medium text-gray-600';

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

/**
 * Ledger row — strongest contextual label (show name); one step below page-title scale.
 */
export const workspaceLedgerContextTitle =
  'text-sm font-semibold leading-snug text-gray-900';

/** Linked show name in ledger (desktop + mobile). */
export const workspaceLedgerShowNameLink = `${workspaceLedgerContextTitle} underline-offset-2 hover:text-gray-700 hover:underline`;

/** Non-link show label (e.g. no show id). */
export const workspaceLedgerShowNamePlain = `${workspaceLedgerContextTitle} text-gray-600`;

/**
 * Shared ledger row baseline: same neutral hover tint as Balances (`workspaceTableRowInteractive`).
 * Role-specific rows add cursor, group, and optional inset rails — never a different hover strength.
 */
export const workspaceLedgerRowBaseline = `${workspaceTableRowInteractive} select-none transition-[background-color,box-shadow] duration-200 ease-out`;

/**
 * Wholesaler ledger — payment row (whole row selects inline edit). Emerald inset rail on hover; `group/ledger-payment` for trailing edit affordance.
 */
export const workspaceLedgerRowPayment =
  'group/ledger-payment cursor-pointer ' +
  workspaceLedgerRowBaseline +
  ' hover:shadow-[inset_3px_0_0_0_rgba(16,185,129,0.24)]';

/**
 * Wholesaler ledger — itemized settlement (row toggles line items). Stone inset rail; `group/ledger-settlement` for disclosure icon tone.
 */
export const workspaceLedgerRowSettlementExpandable =
  'group/ledger-settlement cursor-pointer ' +
  workspaceLedgerRowBaseline +
  ' hover:shadow-[inset_3px_0_0_0_rgba(120,113,108,0.16)]';

/**
 * Show detail — settlement row with chevron expand (expand control is a button, not whole-row click).
 * Same stone rail + disclosure group as ledger so {@link WorkspaceLedgerDisclosureIcon} matches.
 */
export const workspaceShowSettlementRowDisclosure =
  'group/ledger-settlement ' +
  workspaceLedgerRowBaseline +
  ' hover:shadow-[inset_3px_0_0_0_rgba(120,113,108,0.16)]';

/**
 * Wholesaler ledger — informational settlement (no expand, not editable). Same hover scan as other rows; default cursor.
 */
export const workspaceLedgerRowSettlement =
  'cursor-default ' + workspaceLedgerRowBaseline;

/** Subtle selected payment row (paired with {@link workspaceLedgerRowPayment}). */
export const workspaceLedgerRowPaymentSelected =
  'bg-emerald-50/40 shadow-[inset_3px_0_0_0_rgba(16,185,129,0.36)] hover:bg-emerald-50/50 hover:shadow-[inset_3px_0_0_0_rgba(16,185,129,0.42)]';

/**
 * Manual vendor expense (owed, non-show) — same interaction model as payment; amber rail.
 */
export const workspaceLedgerRowVendorExpense =
  'group/ledger-vendor-expense cursor-pointer ' +
  workspaceLedgerRowBaseline +
  ' hover:shadow-[inset_3px_0_0_0_rgba(217,119,6,0.22)]';

export const workspaceLedgerRowVendorExpenseSelected =
  'bg-amber-50/40 shadow-[inset_3px_0_0_0_rgba(217,119,6,0.34)] hover:bg-amber-50/50 hover:shadow-[inset_3px_0_0_0_rgba(217,119,6,0.4)]';

/** Narrow columns that reserve disclosure / edit affordances — pair with {@link WorkspaceTableRow} ledger cells. */
export const workspaceLedgerAffordanceColWidth =
  'w-9 min-w-[2.25rem] sm:w-10 sm:min-w-[2.5rem]';

/**
 * Expanded settlement line items: subordinate detail (not a nested card). Left rail + flat wash.
 */
export const workspaceLedgerDetailPanel =
  'border-l-2 border-stone-200/80 bg-gray-50/90 py-2 pl-3 pr-2 sm:pl-4 sm:pr-3';

export const workspaceLedgerDetailTableHead =
  'text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500';

export const workspaceLedgerDetailCell =
  'py-1.5 text-xs tabular-nums text-gray-700 sm:py-2 sm:text-sm';

export const workspaceLedgerDetailCellMuted =
  'py-1.5 text-xs tabular-nums text-gray-600 sm:py-2 sm:text-sm';

/**
 * Running balance cell — primary vs supporting columns without oversized type.
 * Combine with {@link workspaceListPrimaryMoneyAmountClass} / semantic money helpers.
 */
export const workspaceLedgerRunningBalanceAmount =
  'text-sm font-semibold tabular-nums sm:text-base';

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

/**
 * Leading/trailing icon size inside workspace action buttons (pair with Heroicons `outline` 24px).
 * Buttons use `inline-flex … gap-1.5` — place icon as first child before label text.
 */
export const workspaceActionIconMd = 'h-4 w-4 shrink-0';

/** Compact row/section actions (`*Sm` tokens). */
export const workspaceActionIconSm = 'h-3.5 w-3.5 shrink-0';

const focusRingDark =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

const focusRingSoft =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400';

/**
 * Primary page/section action — e.g. + Show (filled dark).
 */
export const workspaceActionPrimaryMd = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 active:bg-gray-950 ${focusRingDark}`;

/**
 * {@link WorkspaceSidePanelTrigger} — default (Shows header): boutique-tinted surface.
 */
export const workspaceSidePanelTriggerShellDefault = `group inline-flex min-h-8 max-h-9 min-w-0 max-w-full shrink-0 items-center gap-2 self-start rounded-lg border border-stone-300/90 bg-[rgba(245,243,240,0.97)] px-3.5 py-1.5 text-left text-sm font-medium leading-snug text-stone-800 shadow-[0_1px_2px_rgba(28,25,23,0.07)] ring-1 ring-stone-900/[0.05] outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:border-stone-400/95 hover:bg-[rgba(239,236,232,0.98)] hover:shadow-[0_2px_8px_-3px_rgba(28,25,23,0.1)] active:bg-stone-200/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 disabled:pointer-events-none disabled:opacity-60`;

/**
 * {@link WorkspaceSidePanelTrigger} — subtle (e.g. dashboard): lighter emphasis, same motion model.
 */
export const workspaceSidePanelTriggerShellSubtle = `group inline-flex min-h-8 max-h-9 min-w-0 max-w-full shrink-0 items-center gap-2 self-start rounded-lg border border-stone-200/95 bg-white/90 px-3.5 py-1.5 text-left text-sm font-medium leading-snug text-stone-800 shadow-[0_1px_2px_rgba(28,25,23,0.05)] ring-1 ring-stone-900/[0.035] outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:border-stone-300/95 hover:bg-stone-50/95 hover:shadow-[0_2px_6px_-3px_rgba(28,25,23,0.08)] active:bg-stone-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 disabled:pointer-events-none disabled:opacity-60`;

/**
 * Engaged state while the target panel is open — default variant.
 */
export const workspaceSidePanelTriggerOpenDefault = `border-stone-500/55 bg-stone-200/55 text-stone-900 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.18),0_1px_2px_rgba(28,25,23,0.06)] ring-stone-900/10 hover:border-stone-500/60 hover:bg-stone-200/65`;

/**
 * Engaged state while the target panel is open — subtle variant.
 */
export const workspaceSidePanelTriggerOpenSubtle = `border-stone-400/70 bg-stone-100/90 text-stone-900 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.14),0_1px_2px_rgba(28,25,23,0.05)] ring-stone-900/[0.08] hover:border-stone-500/55 hover:bg-stone-100/95`;

/**
 * Secondary page/section action — Record payment in header, supporting flows (outline).
 */
export const workspaceActionSecondaryMd = `inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 ${focusRingSoft}`;

/**
 * Completion workflow — Close out, Mark done (row / compact).
 */
export const workspaceActionCompleteSm = `inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-800 ${focusRingDark}`;

/**
 * Completion workflow — section-level (e.g. show detail close out).
 */
export const workspaceActionCompleteMd = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingDark}`;

/**
 * Neutral row follow-up — View, Cancel-style outline.
 */
export const workspaceActionSecondarySm = `inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50 ${focusRingSoft}`;

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

const focusRingEmerald =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/55';

/**
 * Positive completion — Record payment, Mark as paid, confirm-success (emerald; not destructive).
 */
export const workspaceActionPositiveCompleteMd = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(4,120,87,0.2)] transition-[background-color,box-shadow] duration-200 hover:bg-emerald-700 hover:shadow-[0_2px_10px_-2px_rgba(4,120,87,0.28)] active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingEmerald}`;

/**
 * Compact positive completion (e.g. Mark as paid in workflow strips).
 */
export const workspaceActionPositiveCompleteSm = `inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingEmerald}`;

/**
 * Positive completion — outline emerald (calmer than {@link workspaceActionPositiveCompleteSm}; dense strips / secondary to page chrome).
 */
export const workspaceActionPositiveOutlineSm = `inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-200/90 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900 shadow-sm transition-colors hover:border-emerald-300/90 hover:bg-emerald-50/75 active:bg-emerald-50/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingEmerald}`;

/**
 * @deprecated Prefer {@link workspaceActionPrimaryMd} for neutral creation CTAs or {@link workspaceActionPositiveCompleteMd} for success-style completion. Rose retained only for legacy call sites until migrated.
 * Warm / rose — use sparingly; reads as danger-adjacent next to emerald success actions.
 */
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
