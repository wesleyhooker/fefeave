/**
 * Admin workspace — source of truth for neutral chrome + semantics.
 * **Interaction reference:** the dashboard (`/admin/dashboard`) — match its row hover, title links,
 * action chip sizes, and money treatment when building new admin lists or tables.
 *
 * ## Visual hierarchy (three layers)
 *
 * | Layer | Role | Tokens / components |
 * |-------|------|---------------------|
 * | 1 — Global chrome | Workspace top bar (logo, env, profile) — structured, warm-tinted band | `workspaceGlobalHeaderBar` + `WorkspaceHeader` |
 * | 2 — Page context | Barely-warm intro band (title, subtitle, page actions) — clean bottom border, no gradient/blob | `workspacePageIntroZone` / `workspacePageEntityIntroZone` + `AdminPageIntroSection` + `AdminPageIntro` |
 * | 3 — Work surface | Cards, tables, forms on warm shell | `workspaceShellBg` + `AdminPageContainer` + `workspaceCard` / `workspacePanel` |
 *
 * ## Brand color usage (admin-only)
 *
 * Brand-warm appears only in deliberate places: the page-intro left rail accent
 * (`workspacePageIntroAccent`), sidebar active pill + active icon glyph
 * (`workspaceNavItem*` / `workspaceNavIcon*`), page-level filled CTAs
 * (`workspaceActionPrimaryMd`, `workspaceActionCompleteMd`), and side-panel
 * trigger insets. **Cards, tables, money, and small row commits stay neutral.**
 * Tokens live as `--admin-*` CSS vars (`frontend/system/tokens.css`) and as
 * Tailwind `admin.*` utilities (`bg-admin-canvas`, `bg-admin-actionPrimary`,
 * `border-admin-border`, legacy `admin-brand`, etc.). Public site keeps `--fefe-*` untouched.
 *
 * ## Action tiers (meaning + emphasis)
 *
 * | Tier | Use | Token(s) |
 * |------|-----|----------|
 * | Primary (brand) | Create / page-level commit (e.g. + Show, Close show) | `workspaceActionPrimaryMd`, `workspaceActionCompleteMd` |
 * | Row commit (neutral) | Small row-level Save / Mark done — must not compete with page CTAs | `workspaceActionCompleteSm` (gray-900) |
 * | Secondary | Supporting outline (cancel, back, alternate path) | `workspaceActionSecondaryMd` / `*Sm` |
 * | Utility | Toolbar menus, filters, export — quieter than secondary | `workspaceActionUtilityMd` / `workspaceActionUtilitySm` |
 * | Financial | Money-out (Pay) | `workspaceActionFinancialSm` |
 * | Positive completion | Record payment / mark paid (emerald) | `workspaceActionPositiveCompleteMd` / `*Sm`, `workspaceActionPositiveOutlineSm` |
 * | Destructive confirm | Confirm-dialog danger fill (rose; distinct from primary terracotta CTAs) | `workspaceActionWarmPrimaryMd` |
 * | Tertiary / chip | Compact nav chips ("All shows") | `workspaceActionTertiaryLink` |
 * | Inline text | Row-level text actions that must not read as buttons | `workspaceActionInlineText` |
 * | Side panel workflow | Opens docked right panel (create flows) | `WorkspaceSidePanelTrigger` + `workspaceSidePanelTriggerShell*` / `*Primary` for terracotta chrome CTAs |
 *
 * ## Where things live (do not duplicate ad hoc Tailwind for these concerns)
 *
 * | Concern | Home |
 * |---------|------|
 * | Shell, cards, panels, table chrome, section headers | This file (`workspaceUi.ts`) |
 * | Money tone on values (positive / liability / neutral) | This file — `workspaceMoney*` + helpers |
 * | Action meaning + size (primary, Pay, Close out, row vs page) | This file — `workspaceAction*` |
 * | Row hover + title link pattern | This file — `workspaceTableRowInteractive`, `workspaceRowTitleLink` |
 * | Entity-detail intro (breadcrumb links + right-aligned trail) | This file — `workspaceEntityDetailBreadcrumb*` + `AdminPageIntro` `variant="entity-detail"` |
 * | Show Open/Closed pill (list + header) | `ShowStatusPill.tsx` + `workspaceShowStatus*` here |
 * | Vendor payment state (Unpaid / Partially paid / Paid) | `WorkspaceListPaymentStatus` + `getWorkspacePaymentStatus` in `_lib/workspacePaymentStatus.ts` |
 * | Show detail settlement rollup (Open/Paid/Unpaid) | This file — `workspaceDetailSettlement*` |
 * | Workspace shadows | `tailwind.config.ts` — `shadow-workspace-surface*` |
 * | Sidebar nav + panel surface + account zone | This file — `workspaceNavItemBase` / `workspaceNavItemActive` / `workspaceNavItemInactive` / `workspaceNavIconActive` / `workspaceNavIconInactive` / `workspaceSidebarSurface` / `workspaceSidebarAccountSection` / `workspaceSidebarAccountSignOutCluster` / `workspaceSidebarBrandTitleLink` / `workspaceSidebarAvatar` / `workspaceSidebarSignOut` / …; composition `AdminSidebar.tsx` |
 * | Header/menu hover (chrome) | This file — `workspaceChromeHover` (+ `workspaceChromeTransition` / `workspaceChromeHoverWarm`) |
 * | Loading skeletons shaped like admin pages | `AdminPageSkeletons.tsx` |
 * | Page region stacks/grids (intro-adjacent, primary/secondary columns) | `_lib/workspacePageRegions.ts` |
 * | Summary stat tiles (dashboard-style cards) | `AdminSummaryStatGrid.tsx` + `workspaceStatTile` (soft peach); semantic shells `workspaceStatTileProfit` / `workspaceStatTileOwed` / `workspaceStatTileCompleted` / `workspaceStatTileAttention` (sage); icon chips `workspaceDashboardStatIcon*` |
 * | Section toolbar (filters left, actions right) | `AdminWorkspaceToolbar.tsx` + `workspaceSectionToolbar` |
 * | Page region stacks/grids (intro-adjacent, primary/secondary columns) | `_lib/workspacePageRegions.ts` |
 * | Summary stat tiles (unified KPI cards) | `AdminSummaryStatGrid.tsx` + `getWorkspaceSummaryStatSurfaceClass(surface)` (`WorkspaceStatCardSurface`); shells `workspaceStatTileSurface*` + legacy aliases `workspaceStatTileProfit` / `workspaceStatTileOwed` / `workspaceStatTileCompleted`; KPI header `workspaceStatTileKpiTopRow` + `workspaceStatTileKpiLabelBesideIcon`; per-surface chips `workspaceDashboardStatIcon*` + `getWorkspaceSummaryStatIconChipClass(surface)` |
 * | Section toolbar (filters left, actions right) | `AdminWorkspaceToolbar.tsx` + `workspaceSectionToolbar` |
 * | Page region stacks/grids (intro-adjacent, primary/secondary columns) | `_lib/workspacePageRegions.ts` |
 * | Summary stat tiles (dashboard-style cards) | `AdminSummaryStatGrid.tsx` + `workspaceStatTile` |
 * | Section toolbar (filters left, actions right) | `AdminWorkspaceToolbar.tsx` + `workspaceSectionToolbar` |
 * | Styled native `<select>` / text / date | `workspaceSelect`, `workspaceTextInput`, `workspaceDateInput` + `WorkspaceNativeSelect.tsx` |
 * | Segmented toolbar filter | `workspaceSegmentedTrack` / `workspaceSegmentedButton*` + `WorkspaceSegmentedControl.tsx` |
 * | Toolbar Export / Actions menu | `WorkspaceToolbarMenu.tsx` (trigger: `workspaceActionUtilityMd`; panel: `workspaceToolbarMenuPanel` / `workspaceToolbarMenuItem*`) |
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
 * Shadows: `shadow-workspace-surface-warm*` / legacy `shadow-workspace-surface*` (tailwind.config).
 */

/** Page / shell — warm canvas (clearly tinted vs white cards). */
export const workspaceShellBg = 'bg-admin-canvas';

/**
 * Main column (header + content): single left rule on md+ so the seam with the
 * sidebar is one deliberate edge (pairs with header border-b at the junction).
 */
export const workspaceShellColumn = 'flex min-w-0 flex-1 flex-col';

/**
 * Layer 1 — workspace top header only (`WorkspaceHeader`).
 * Warm tinted band (pairs with sidebar + shell); no gradient.
 */
export const workspaceGlobalHeaderBar = 'relative z-20 bg-admin-canvas';

/** Workspace selector cluster — sits flush on canvas (no lifted white chip). */
export const workspaceHeaderBrandCluster =
  'flex min-w-0 items-center gap-2 rounded-xl border border-admin-border/45 bg-admin-canvas px-2.5 py-2 md:gap-2.5 md:px-3 md:py-1.5';

/** Fefe Ave wordmark inside {@link workspaceHeaderBrandCluster}. */
export const workspaceHeaderBrandLink =
  'flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 text-lg font-semibold text-admin-ink transition-colors hover:text-admin-inkMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 md:min-h-0 md:px-1 md:py-0.5 md:pr-1';

/** Transitions for workspace chrome — restrained, no bouncy motion */
export const workspaceChromeTransition =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none';

/**
 * Slightly stronger than gray-100 on white chrome (sidebar, header, menus).
 */
export const workspaceChromeHover = `${workspaceChromeTransition} hover:bg-gray-200/55 active:bg-gray-300/35`;
export const workspaceChromeHoverWarm = `${workspaceChromeTransition} hover:bg-stone-200/45 active:bg-stone-300/30`;

// --- Sidebar nav (active + inactive item, icon glyph) -----------------------

/**
 * Shared shape, padding, and motion for sidebar nav items. Pair with one of
 * `workspaceNavItemActive` or `workspaceNavItemInactive` for state.
 */
export const workspaceNavItemBase =
  'group relative flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[color,background-color] duration-200 ease-out motion-reduce:transition-none';

/**
 * Active nav item — peach-cream pill on clay: slightly warmer fill vs sidebar,
 * single soft lift shadow + inset gleam + thin warm ring (spacing from `workspaceNavItemBase`).
 */
export const workspaceNavItemActive =
  'bg-black/[0.14] font-medium text-white shadow-none ring-0 transition-[color,background-color] duration-200 ease-out motion-reduce:transition-none';

/**
 * Inactive nav — warm light text on clay; hover is a visible tonal lift (darker wash).
 */
export const workspaceNavItemInactive =
  'text-admin-sidebarTextMuted transition-[color,background-color] duration-200 ease-out hover:bg-black/[0.10] hover:text-white motion-reduce:transition-none';

/**
 * Active icon chip — slightly deeper tone on clay (no bright white pill).
 */
export const workspaceNavIconActive =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.12] text-white ring-0 shadow-none transition-[color,background-color] duration-200 ease-out motion-reduce:transition-none';

/**
 * Inactive icon chip — soft clay tone; deepens on row hover.
 */
export const workspaceNavIconInactive =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.08] text-admin-sidebarText transition-[color,background-color] duration-200 ease-out motion-reduce:transition-none group-hover:bg-black/[0.14] group-hover:text-white';

/** Sidebar — warm clay wash (deeper than page canvas + primary CTA). */
export const workspaceSidebarSurface =
  'border-r border-admin-sidebarDivider/40 bg-gradient-to-b from-admin-sidebarSurface to-admin-sidebarSurfaceDeep';

/** Bottom account region — divider from nav, identity cluster + separated sign-out (`mt-auto` in flex column). */
export const workspaceSidebarAccountSection =
  'mt-auto flex flex-col gap-3 border-t border-admin-sidebarDivider/72 pt-3.5';

/** Divider + cushion above sidebar sign-out so it reads as account actions vs identity meta. */
export const workspaceSidebarAccountSignOutCluster =
  'border-t border-admin-sidebarDivider/65 pt-3.5';

/** Circular initial glyph on clay (session email / display line). */
export const workspaceSidebarAvatar =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fefe-warm-sand/70 bg-fefe-warm-sand font-fefe-heading text-sm font-semibold leading-none text-fefe-gold';

/** Primary line — email or signed-in fallback (truncate). */
export const workspaceSidebarUserDisplayName =
  'truncate text-sm font-semibold leading-snug text-admin-sidebarText';

/** Wrap session role strings as quiet chips (only render for non-empty roles). */
export const workspaceSidebarRolePill =
  'rounded-md bg-white/12 px-1.5 py-0.5 text-[11px] font-medium leading-none text-admin-sidebarTextMuted';

/** Brand title link in sidebar header (optional; warm clay hover). */
export const workspaceSidebarBrandTitleLink =
  'text-admin-sidebarText transition-colors hover:text-admin-sidebarTextMuted';

/** Compact sign-out control — icon + label. */
export const workspaceSidebarSignOut =
  'flex w-full min-h-[2.75rem] items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-admin-sidebarText transition-colors hover:bg-white/14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45';

/**
 * Lighter inset band on the shell (filters, totals). Steps up toward white
 * without matching card white.
 */
export const workspaceMutedStrip = 'bg-admin-mutedStrip';

/** Content card / panel — clean white on warm canvas */
export const workspaceCard =
  'rounded-lg border border-admin-border/95 bg-admin-surfaceElevated shadow-workspace-surface-warm';

/**
 * Show detail — **left**: build payout + settlements (neutral operating rail).
 */
export const workspaceShowDetailOperatingShell = `${workspaceCard} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_2px_16px_-8px_rgba(120,113,108,0.08)]`;

/**
 * Show detail — **right**: outcome / close-out card. Flat warm surface (no gradient,
 * no rose accent rail); reads as "outcome" via placement + content, not via tint.
 */
export const workspaceShowDetailOutcomeShell =
  'rounded-lg border border-admin-border/90 bg-admin-mutedStrip/85 shadow-workspace-surface-warm-sm';

/**
 * Balances index — primary liability table (importance without dense styling).
 */
export const workspaceBalancesPrimaryTableShell =
  'min-w-0 overflow-hidden rounded-xl border border-admin-border/95 bg-white shadow-[0_4px_28px_-14px_rgba(120,113,108,0.16)]';

/** Sticky head for financial index tables (Balances). */
export const workspaceTableTheadFinancial =
  'sticky top-0 z-10 border-b border-admin-border/80 bg-gradient-to-b from-stone-100/95 to-stone-100/75';

/**
 * Wholesaler detail — **left** money / payment control stack.
 */
export const workspaceBalanceDetailControlShell =
  'overflow-hidden rounded-xl border border-admin-border/95 bg-white shadow-[0_4px_24px_-12px_rgba(120,113,108,0.14)]';

/** Bordered white surface with a lighter lift (nested blocks) */
export const workspacePanel =
  'rounded-lg border border-admin-border/95 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm';

/**
 * Wholesaler detail — **right** ledger (flat, trustworthy record; not decorative).
 */
export const workspaceBalanceDetailLedgerShell = `${workspacePanel} border-admin-border/90 bg-admin-mutedStrip shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95)]`;

/** Header row inside a card-style block */
export const workspaceCardHeader =
  'border-b border-admin-border/90 bg-admin-mutedStrip/55 px-4 py-3';

/**
 * Toolbar strip for a section title + right-side links (matches dashboard “Shows this week” bar).
 */
export const workspaceSectionToolbar =
  'flex flex-wrap items-center justify-between gap-2 border-b border-admin-border/90 bg-admin-mutedStrip/45 px-4 py-3';

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

/**
 * Shared horizontal frame for workspace header + page intro/content so titles
 * and cards share the same left edge (gutter + max width).
 */
export const workspaceMainContentInset = `${workspacePageGutter} ${workspacePageContentWidth}`;

/** Shared admin page stack rhythm under intro zone. */
export const workspacePageContentStack = 'flex flex-col gap-7 md:gap-8';

/** Shows index: extra air between “This week” and later sections. */
export const workspaceShowsIndexContentStack = 'flex flex-col gap-9 md:gap-11';

/** Single owner of spacing between intro zone and the first content row. */
export const workspacePageIntroToContentGap = 'pt-2 md:pt-2.5';

/**
 * Reusable workspace page-intro zone (page layer, not a content card).
 * No radius/shadow/panel border; this is page framing under the workspace top nav.
 * Barely-warm subtle band + one clean neutral bottom border. No gradient, no
 * decorative hairlines, no wave/blob — warmth comes from the surface tint and
 * the small accent rail (`workspacePageIntroAccent`) only.
 */
export const workspacePageIntroZone = 'relative z-10 bg-admin-canvas';

/**
 * Flatter intro strip for nested entity pages (e.g. wholesaler under Balances).
 * Plain white — even quieter than default; entity-detail does not carry brand tint.
 */
export const workspacePageEntityIntroZone =
  'relative z-10 bg-white border-b border-stone-200/80';

/** Vertical rhythm inside intro zone; horizontal rhythm comes from main layout padding. */
export const workspacePageIntroZoneInner = 'relative';

/**
 * Optional left accent rail for intro text block — primary action terracotta (brighter than sidebar clay).
 */
export const workspacePageIntroAccent =
  'border-l-[3px] border-admin-actionPrimary pl-3.5 sm:pl-4';

/**
 * Entity-detail breadcrumb — subtle terracotta links (`--admin-actionPrimary`).
 * Use on `<Link>` / `<a>` segments (not the current-page crumb).
 */
export const workspaceEntityDetailBreadcrumbLink =
  'rounded-sm font-medium text-admin-actionPrimary/88 underline decoration-admin-actionPrimary/45 underline-offset-[3px] transition-colors hover:text-admin-actionPrimary hover:decoration-admin-actionPrimary/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45';

/** Entity-detail breadcrumb `<ol>` — wraps on small screens; end-aligned on `sm+` when sitting in the intro right column. */
export const workspaceEntityDetailBreadcrumbList =
  'flex flex-wrap items-center justify-start gap-x-2 gap-y-0.5 text-sm text-stone-600 sm:justify-end';

/** Current-page crumb — neutral emphasis (not brand link). */
export const workspaceEntityDetailBreadcrumbCurrent =
  'min-w-0 max-w-full font-semibold tracking-tight text-stone-900';

/** Slash between breadcrumb segments. */
export const workspaceEntityDetailBreadcrumbSep = 'select-none text-stone-300';

/**
 * Page-context date / week pill (intro row, right column) — soft warm inset using
 * admin tokens only (`--admin-border-warm`, `--admin-kpi-soft*`).
 *
 * Typography: pair {@link workspacePageIntroMetaDatePillPeriod} +
 * {@link workspacePageIntroMetaDatePillRange}; single-line contexts use
 * {@link workspacePageIntroMetaDatePillSingle}.
 */
export const workspacePageIntroMetaDatePill =
  'inline-flex max-w-full items-center gap-2 rounded-full border border-admin-border/45 bg-white px-3 py-1.5 shadow-workspace-surface-warm-sm';

/** Leading calendar glyph — compact; compose with Heroicons outline `CalendarIcon`. */
export const workspacePageIntroMetaDatePillCalendarIcon =
  'h-3.5 w-3.5 shrink-0 text-admin-actionPrimary/75';

/** Stacked label + range (dashboard week context). */
export const workspacePageIntroMetaDatePillTextCol =
  'flex min-w-0 flex-col gap-0 leading-tight';

/** Primary line — period label (“This week”). */
export const workspacePageIntroMetaDatePillPeriod =
  'text-xs font-semibold tracking-tight text-admin-ink';

/** Secondary line — compact date range (`formatWeekRangeCompact`, etc.). */
export const workspacePageIntroMetaDatePillRange =
  'text-[11px] font-medium tabular-nums leading-snug text-admin-inkMuted';

/** One-line contexts (e.g. show headline date beside icon). */
export const workspacePageIntroMetaDatePillSingle =
  'text-xs font-semibold tabular-nums leading-snug text-admin-ink';

/** In-card section H2 */
export const workspaceSectionTitle =
  'text-base font-semibold tracking-tight text-admin-ink';

/** Uppercase label above a metric or block */
export const workspaceLabelEyebrow =
  'text-[11px] font-semibold uppercase tracking-wider text-admin-inkMuted';

/**
 * Ledger index tables — softer row separators than generic `divide-gray-100`
 * so long streams scan without heavy grid lines.
 */
export const workspaceLedgerTableDivide = 'divide-y divide-stone-100/[0.65]';

/**
 * Shared flex geometry + padding for KPI / summary stat tiles.
 * Pair with semantic border / gradient / shadow (`workspaceStatTile*`) — do not use bare unless composing a new variant.
 */
export const workspaceStatTileShell =
  'flex min-h-[7.75rem] flex-col rounded-xl px-4 py-4 shadow-workspace-surface-warm-sm sm:min-h-[8rem] sm:px-5 sm:py-5';

/** Legacy stacked layout: icon row, then eyebrow — prefer {@link workspaceStatTileKpiTopRow} + {@link workspaceStatTileKpiLabelBesideIcon}. */
export const workspaceStatTileLabelRow =
  'flex items-start justify-between gap-3 sm:gap-4';

/** Top row — icon-only leading decoration (legacy stacked layout: icon row, then eyebrow below). */
export const workspaceStatTileIconRow = 'flex items-start justify-start gap-0';

/**
 * KPI header — circular icon chip + uppercase label on one band (preferred dashboard / summary layout).
 */
export const workspaceStatTileKpiTopRow =
  'flex min-w-0 items-center gap-3.5 sm:gap-4';

/** Wrapper for the round KPI icon chip (leading). */
export const workspaceStatTileIconWrap = 'flex shrink-0 items-center';

/**
 * Primary metric block below the eyebrow — use with {@link workspaceStatTileValue} / error content / loading placeholders.
 */
export const workspaceStatTileValueSlot =
  'mt-3 flex min-h-[2.75rem] flex-1 flex-col gap-1.5 sm:mt-3.5';

/** Typography baseline for the main KPI figure (consumers add semantic color classes). */
export const workspaceStatTileValue =
  'text-xl font-bold tabular-nums tracking-tight sm:text-[1.625rem] sm:leading-snug';

/**
 * Optional secondary line — render only when real supporting copy exists (never placeholder metrics).
 */
export const workspaceStatTileMeta = 'text-xs leading-snug text-admin-inkMuted';

/**
 * Canonical stat-card surfaces (`AdminSummaryStatGrid` — one vocabulary app-wide).
 * Token-driven KPI depth + warm gradients (`tokens.css`, `tailwind.config.ts` admin.*).
 */
export type WorkspaceStatCardSurface =
  | 'profit'
  | 'owed'
  | 'completed'
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'warning'
  | 'attention';

/** Soft peach — default KPI lane (single tinted layer). */
export const workspaceStatTileSurfaceProfit = `${workspaceStatTileShell} border border-admin-actionPrimary/14 bg-admin-kpiSoft`;

/** Vendors owed — stronger peach / clay-wash (full accent, not washed out). */
export const workspaceStatTileSurfaceOwed = `${workspaceStatTileShell} border border-admin-actionPrimary/18 bg-admin-kpiAccent`;

/** Muted gold — completions / milestones. */
export const workspaceStatTileSurfaceCompleted = `${workspaceStatTileShell} border border-amber-900/12 bg-admin-kpiGold`;

/** Mint-sage — profit / paid / favorable (YTD profit, paid totals). */
export const workspaceStatTileSurfacePositive = `${workspaceStatTileShell} border border-emerald-800/22 bg-emerald-100`;

/** Rose wash — outstanding / liability emphasis. */
export const workspaceStatTileSurfaceNegative = `${workspaceStatTileShell} border border-rose-800/24 bg-rose-100`;

/** Warm cream baseline. */
export const workspaceStatTileSurfaceNeutral = `${workspaceStatTileShell} border border-admin-border/90 bg-admin-mutedStrip shadow-workspace-surface-warm-sm ring-1 ring-stone-400/12`;

/** Amber caution. */
export const workspaceStatTileSurfaceWarning = `${workspaceStatTileShell} border border-amber-900/32 bg-admin-kpiGold/75 shadow-workspace-surface-warm-sm ring-1 ring-amber-950/14`;

/** Warm sand — counts / review (readable on canvas; not washed out). */
export const workspaceStatTileSurfaceAttention = `${workspaceStatTileShell} border border-amber-900/14 bg-admin-kpiGold`;

/** @deprecated Prefer {@link workspaceStatTileSurfaceProfit} — alias for legacy imports. */
export const workspaceStatTile = workspaceStatTileSurfaceProfit;

/** @deprecated Prefer {@link workspaceStatTileSurfaceProfit}. */
export const workspaceStatTileProfit = workspaceStatTileSurfaceProfit;

/** @deprecated Prefer {@link workspaceStatTileSurfaceOwed}. */
export const workspaceStatTileOwed = workspaceStatTileSurfaceOwed;

/** @deprecated Prefer {@link workspaceStatTileSurfaceCompleted}. */
export const workspaceStatTileCompleted = workspaceStatTileSurfaceCompleted;

/** @deprecated Prefer {@link workspaceStatTileSurfaceAttention}. */
export const workspaceStatTileAttention = workspaceStatTileSurfaceAttention;

export function getWorkspaceSummaryStatSurfaceClass(
  surface?: WorkspaceStatCardSurface | undefined,
): string {
  switch (surface ?? 'profit') {
    case 'profit':
      return workspaceStatTileSurfaceProfit;
    case 'owed':
      return workspaceStatTileSurfaceOwed;
    case 'completed':
      return workspaceStatTileSurfaceCompleted;
    case 'positive':
      return workspaceStatTileSurfacePositive;
    case 'negative':
      return workspaceStatTileSurfaceNegative;
    case 'neutral':
      return workspaceStatTileSurfaceNeutral;
    case 'warning':
      return workspaceStatTileSurfaceWarning;
    case 'attention':
      return workspaceStatTileSurfaceAttention;
  }
  return workspaceStatTileSurfaceProfit;
}

/**
 * Icon chip shell paired with {@link WorkspaceStatCardSurface} for dashboards + skeletons.
 */
export function getWorkspaceSummaryStatIconChipClass(
  surface: WorkspaceStatCardSurface,
): string {
  switch (surface) {
    case 'profit':
      return workspaceDashboardStatIconProfit;
    case 'owed':
      return workspaceDashboardStatIconOwed;
    case 'completed':
      return workspaceDashboardStatIconCompleted;
    case 'positive':
      return workspaceDashboardStatIconPositive;
    case 'negative':
      return workspaceDashboardStatIconNegative;
    case 'neutral':
      return workspaceDashboardStatIconNeutral;
    case 'warning':
      return workspaceDashboardStatIconWarning;
    case 'attention':
      return workspaceDashboardStatIconAttention;
  }
  return workspaceDashboardStatIconProfit;
}

/**
 * KPI figure color on neutral-wash summary tiles — pair with `variant: 'neutral'`.
 */
export const workspaceStatTileValueToneNeutral = 'text-admin-ink';

/**
 * KPI figure on warning-wash (clay) tiles — pair with `variant: 'warning'`.
 */
export const workspaceStatTileValueToneWarning = 'text-admin-ink';

/** Shared round icon chip — soft neutral lift; pair with profit / owed / completed tone classes. */
const workspaceDashboardStatIconShell =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-admin-border/40 sm:h-10 sm:w-10';

/** Dashboard KPI — YTD profit ($ glyph); muted terracotta on cream chip. */
export const workspaceDashboardStatIconProfit = `${workspaceDashboardStatIconShell} text-[15px] font-bold leading-none text-admin-actionPrimary/72 sm:text-base`;

/** Dashboard KPI — vendors owed; clay/peach glyph on cream chip (`--admin-kpi-accent-deep`). */
export const workspaceDashboardStatIconOwed = `${workspaceDashboardStatIconShell} text-orange-900/72 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem] sm:[&_svg]:h-[1.35rem] sm:[&_svg]:w-[1.35rem]`;

/** Dashboard KPI — completed; muted warm gold glyph. */
export const workspaceDashboardStatIconCompleted = `${workspaceDashboardStatIconShell} text-amber-900/70 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem] sm:[&_svg]:h-[1.35rem] sm:[&_svg]:w-[1.35rem]`;

/** Semantic aliases for balances / attention tiles (same chip family as dashboard KPIs). */
export const workspaceDashboardStatIconPositive =
  workspaceDashboardStatIconProfit;
export const workspaceDashboardStatIconNegative =
  workspaceDashboardStatIconOwed;
export const workspaceDashboardStatIconNeutral =
  workspaceDashboardStatIconCompleted;
export const workspaceDashboardStatIconWarning = workspaceDashboardStatIconOwed;
export const workspaceDashboardStatIconAttention =
  workspaceDashboardStatIconCompleted;

/** Eyebrow label inside summary stat tiles */
export const workspaceStatEyebrow =
  'text-[11px] font-semibold uppercase tracking-wider text-admin-inkMuted';

/**
 * Eyebrow immediately below the KPI icon row — spacing only; omitted when there is no icon row above.
 */
export const workspaceStatTileKpiEyebrowGap = 'mt-2.5 sm:mt-3';

/** Convenience: eyebrow + gap after a leading icon (stacked icon → label; prefer {@link workspaceStatTileKpiTopRow} + {@link workspaceStatTileKpiLabelBesideIcon}). */
export const workspaceStatTileKpiEyebrow = `${workspaceStatEyebrow} ${workspaceStatTileKpiEyebrowGap} min-w-0`;

/**
 * Label beside the KPI icon chip — pairs with {@link workspaceStatTileKpiTopRow} (no fabricated metrics row).
 */
export const workspaceStatTileKpiLabelBesideIcon =
  'min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-wider text-admin-ink/[0.78]';

/**
 * Toolbar search field — height aligned with `workspaceActionSecondaryMd` row actions.
 */
export const workspaceToolbarSearchInput =
  'h-10 w-full min-w-0 rounded-lg border border-admin-border/90 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-admin-ink focus:ring-1 focus:ring-admin-ink';

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
  'flex w-full min-w-0 rounded-lg border border-admin-border/90 bg-admin-mutedStrip/75 p-0.5 shadow-[inset_0_1px_1px_rgba(72,53,47,0.05)]';

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
  'flex w-full min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-admin-mutedStrip/80 focus-visible:bg-admin-mutedStrip/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-400/80';

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
export const workspaceInsetFlatList = 'divide-y divide-admin-border/15';

/** Table: row dividers */
export const workspaceTableDivide = 'divide-y divide-admin-border/15';

/** Table head: sticky bar aligned with muted strip (neutral dense tables). */
export const workspaceTheadSticky = 'sticky top-0 z-10 bg-admin-mutedStrip';

/** Interactive table / list row — warm hover wash (no inset accent rails). */
export const workspaceTableRowHover =
  'transition-[background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-admin-kpiSoft/28 active:bg-admin-kpiSoft/36';

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
  'group/shows-nav relative flex w-full min-h-11 min-w-0 items-center gap-3 px-4 py-2.5 text-left text-inherit no-underline outline-none transition-[background-color,box-shadow] duration-200 ease-out hover:bg-admin-kpiSoft/34 hover:shadow-[0_4px_14px_-4px_rgba(72,53,47,0.08),inset_3px_0_0_0_rgb(var(--admin-action-primary)_/_0.22)] active:bg-admin-kpiSoft/42 focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

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
 * Shared ledger row baseline: same warm row hover as Balances (`workspaceTableRowInteractive`).
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
  'border-l-2 border-admin-border/85 bg-admin-mutedStrip/90 py-2 pl-3 pr-2 sm:pl-4 sm:pr-3';

export const workspaceLedgerDetailTableHead =
  'text-left text-[10px] font-medium uppercase tracking-wider text-gray-500';

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
 * KPI figure on positive-wash summary tiles — pair with `variant: 'positive'` (same tone as {@link workspaceMoneyPositive}).
 */
export const workspaceStatTileValueTonePositive = workspaceMoneyPositive;

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
 * Primary page/section action — e.g. + Show (terracotta fill; brighter than sidebar clay).
 */
export const workspaceActionPrimaryMd = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-admin-actionPrimary px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-admin-actionPrimaryHover hover:shadow-[0_4px_14px_-8px_rgb(var(--admin-action-primary)_/_0.38)] active:translate-y-px active:bg-admin-actionPrimaryHover motion-reduce:transition-none motion-reduce:transform-none sm:min-h-10 sm:py-2 ${focusRingDark}`;

/**
 * {@link WorkspaceSidePanelTrigger} — stronger neutral surface (secondary workflows, toolbars).
 */
export const workspaceSidePanelTriggerShellDefault = `group inline-flex min-h-11 min-w-0 max-w-full shrink-0 items-center gap-2 rounded-lg border border-stone-300/90 bg-[rgba(245,243,240,0.97)] px-3 py-2 text-left text-sm font-medium leading-snug text-stone-800 shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary)_/_0.38),0_1px_2px_rgba(28,25,23,0.06)] ring-1 ring-stone-900/[0.05] outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none motion-reduce:transform-none hover:border-stone-400/95 hover:bg-[rgba(239,236,232,0.98)] hover:shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary-hover)_/_0.44),0_2px_8px_-3px_rgba(28,25,23,0.09)] active:translate-y-px active:bg-stone-200/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 disabled:pointer-events-none disabled:opacity-60 sm:min-h-9 sm:py-1.5`;

/**
 * {@link WorkspaceSidePanelTrigger} — quiet outline (supporting panel opens).
 */
export const workspaceSidePanelTriggerShellSubtle = `group inline-flex min-h-11 min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-lg border border-stone-200/95 bg-white/90 px-3 py-2 text-left text-sm font-normal leading-snug text-stone-700 shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary)_/_0.26),0_1px_2px_rgba(28,25,23,0.04)] ring-1 ring-stone-900/[0.03] outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none motion-reduce:transform-none hover:border-stone-300/95 hover:bg-stone-50/95 hover:text-stone-800 hover:shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary-hover)_/_0.34),0_2px_6px_-3px_rgba(28,25,23,0.07)] active:translate-y-px active:bg-stone-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/55 disabled:pointer-events-none disabled:opacity-60 sm:min-h-9 sm:py-1`;

/**
 * {@link WorkspaceSidePanelTrigger} — terracotta primary (same tier as {@link workspaceActionPrimaryMd}; workspace chrome CTAs).
 */
export const workspaceSidePanelTriggerShellPrimary = `group inline-flex min-h-11 min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-lg bg-admin-actionPrimary px-3.5 py-2.5 text-left text-sm font-medium leading-snug text-white shadow-sm outline-none transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-admin-actionPrimaryHover hover:shadow-[0_4px_14px_-8px_rgb(var(--admin-action-primary)_/_0.38)] active:translate-y-px active:bg-admin-actionPrimaryHover motion-reduce:transition-none motion-reduce:transform-none sm:min-h-10 sm:py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:pointer-events-none disabled:opacity-60`;

/**
 * Engaged state while the target panel is open — default variant.
 */
export const workspaceSidePanelTriggerOpenDefault = `border-stone-500/55 bg-stone-200/55 text-stone-900 shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary)_/_0.55),inset_0_0_0_1px_rgba(120,113,108,0.18),0_1px_2px_rgba(28,25,23,0.06)] ring-stone-900/10 hover:border-stone-500/60 hover:bg-stone-200/65`;

/**
 * Engaged state while the target panel is open — subtle variant.
 */
export const workspaceSidePanelTriggerOpenSubtle = `border-stone-400/70 bg-stone-100/90 text-stone-900 shadow-[inset_3px_0_0_0_rgb(var(--admin-action-primary)_/_0.45),inset_0_0_0_1px_rgba(120,113,108,0.14),0_1px_2px_rgba(28,25,23,0.05)] ring-stone-900/[0.08] hover:border-stone-500/55 hover:bg-stone-100/95`;

/**
 * Engaged state while the target panel is open — primary (terracotta) variant.
 */
export const workspaceSidePanelTriggerOpenPrimary = `bg-admin-actionPrimaryHover shadow-[0_4px_14px_-8px_rgb(var(--admin-action-primary)_/_0.42)]`;

/**
 * Secondary page/section action — Record payment in header, supporting flows (outline).
 */
export const workspaceActionSecondaryMd = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-admin-border/90 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-admin-border hover:bg-admin-mutedStrip/75 hover:shadow-[0_4px_14px_-10px_rgba(62,48,42,0.2)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none sm:min-h-10 sm:py-2 ${focusRingSoft}`;

/**
 * Completion workflow — Close out, Mark done (row / compact).
 */
export const workspaceActionCompleteSm = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-gray-800 hover:shadow-[0_3px_10px_-6px_rgba(17,24,39,0.35)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none ${focusRingDark}`;

/**
 * Completion workflow — section-level (e.g. show detail close out).
 * Brand-filled: this is the page-level commit. Pair with `workspaceActionCompleteSm`
 * (kept neutral) for row-level commits so small saves don't compete with page CTAs.
 */
export const workspaceActionCompleteMd = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-admin-actionPrimary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-admin-actionPrimaryHover hover:shadow-[0_4px_14px_-8px_rgb(var(--admin-action-primary)_/_0.38)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:py-2 ${focusRingDark}`;

/**
 * Neutral row follow-up — View, Cancel-style outline.
 */
export const workspaceActionSecondarySm = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-admin-border/90 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-admin-border hover:bg-admin-mutedStrip/75 hover:shadow-[0_3px_10px_-7px_rgba(62,48,42,0.18)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none ${focusRingSoft}`;

/**
 * Utility toolbar control — Filter, Export, compact menus; quieter than {@link workspaceActionSecondaryMd}
 * so primary/secondary page actions stay visually dominant.
 */
export const workspaceActionUtilityMd = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-admin-border/90 bg-white/90 px-3.5 py-2.5 text-sm font-medium text-stone-600 shadow-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out hover:border-admin-border hover:bg-admin-mutedStrip/80 hover:text-stone-900 hover:shadow-[0_3px_10px_-8px_rgba(28,25,23,0.22)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none sm:min-h-10 sm:py-2 ${focusRingSoft}`;

/** Compact utility control (toolbars, dense strips). */
export const workspaceActionUtilitySm = `inline-flex items-center justify-center gap-1.5 rounded-md border border-admin-border/90 bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600 shadow-none transition-[color,background-color,border-color,transform] duration-200 ease-out hover:border-admin-border hover:bg-admin-mutedStrip/80 hover:text-stone-900 active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none ${focusRingSoft}`;

/**
 * Inline row / table text action — does not compete with {@link workspaceActionPrimaryMd} or chips.
 */
export const workspaceActionInlineText = `text-sm font-medium text-stone-600 underline-offset-2 transition-colors hover:text-stone-900 hover:underline ${focusRingSoft}`;

/**
 * Financial / money-out — Pay (distinct from completion; restrained amber field).
 */
export const workspaceActionFinancialSm = `inline-flex min-h-9 items-center justify-center rounded-md border border-amber-200/90 bg-amber-50/40 px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm transition-[border-color,background-color,box-shadow,transform] hover:border-amber-300/90 hover:bg-amber-50/70 hover:shadow-[0_2px_10px_-4px_rgba(217,119,6,0.18)] active:translate-y-px ${focusRingSoft}`;

/**
 * Tertiary navigation chip — All shows, Balances, footer links.
 */
export const workspaceActionTertiaryLink = `inline-flex min-h-9 items-center justify-center rounded-md border border-admin-border/90 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition-colors hover:border-admin-border hover:bg-admin-mutedStrip/75 ${focusRingSoft}`;

/**
 * Record payment on balance/vendor rows (secondary bucket; not Pay label).
 */
export const workspaceActionRecordPaymentSm = workspaceActionSecondarySm;

const focusRingEmerald =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/55';

/**
 * Positive completion — Record payment, Mark as paid, confirm-success (emerald; not destructive).
 */
export const workspaceActionPositiveCompleteMd = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(4,120,87,0.2)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-emerald-700 hover:shadow-[0_3px_14px_-4px_rgba(4,120,87,0.32)] active:translate-y-px active:bg-emerald-800 motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:py-2 ${focusRingEmerald}`;

/**
 * Compact positive completion (e.g. Mark as paid in workflow strips).
 */
export const workspaceActionPositiveCompleteSm = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-emerald-700 hover:shadow-[0_2px_10px_-4px_rgba(4,120,87,0.28)] active:translate-y-px active:bg-emerald-800 motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 ${focusRingEmerald}`;

/**
 * Positive completion — outline emerald (calmer than {@link workspaceActionPositiveCompleteSm}; dense strips / secondary to page chrome).
 */
export const workspaceActionPositiveOutlineSm = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-emerald-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-900 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-emerald-300/90 hover:bg-emerald-50/75 hover:shadow-[0_3px_10px_-6px_rgba(4,120,87,0.2)] active:translate-y-px active:bg-emerald-50/90 motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 ${focusRingEmerald}`;

/**
 * Destructive confirm fill (rose). Used by {@link WorkspaceConfirmDialog} for
 * `tone="danger"`. **Distinct from `admin-actionPrimary`** — rose carries the destructive
 * semantic and must not be reused for brand commits or page-level CTAs.
 */
export const workspaceActionWarmPrimaryMd =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(190,24,93,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-rose-700 hover:shadow-[0_2px_8px_-2px_rgba(190,24,93,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/50 active:bg-rose-800';

/**
 * Subtle outline action for confirm/cancel dialogs and secondary controls.
 */
export const workspaceActionQuietOutlineMd =
  'inline-flex items-center justify-center rounded-xl border border-admin-border/95 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 shadow-[0_1px_2px_rgba(120,113,108,0.04)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:bg-admin-mutedStrip/70 hover:shadow-[0_3px_10px_-8px_rgba(120,113,108,0.22)] active:translate-y-px motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/40';

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
  'border border-admin-border/90 bg-admin-mutedStrip/90 text-gray-800';

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
