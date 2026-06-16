/**
 * A1 Warm Clay — reseller workspace design tokens.
 *
 * Source of truth for the visual foundation. CSS variables live in
 * `frontend/system/tokens.css`; composed Tailwind classes live in
 * `workspaceUi.ts`. This module documents the token system and exports
 * stable class-name constants for primitives.
 *
 * Shell gutters: {@link WORKSPACE_CONTAINER_GUTTER} in `workspacePageContentWidth.ts`.
 *
 * @see docs/design/a1-workspace-design-system.md
 */

import {
  WORKSPACE_CONTAINER_GUTTER,
  WORKSPACE_CONTAINER_INSET_X,
  WORKSPACE_PAGE_CHROME_INSET_X,
} from './workspacePageContentWidth';

// ---------------------------------------------------------------------------
// Color semantics (Tailwind `admin.*` utilities)
// ---------------------------------------------------------------------------

/**
 * | Role | Token | Tailwind | Use |
 * |------|-------|----------|-----|
 * | Canvas | `--admin-canvas` | `bg-admin-canvas` | Shell, intro band, header |
 * | Surface elevated | `--admin-surface-elevated` | `bg-admin-surfaceElevated` | Cards, panels, tables |
 * | Surface inset | `--admin-muted-strip` | `bg-admin-mutedStrip` | Toolbar bands, muted strips |
 * | Border | `--admin-border` | `border-admin-border` | Card/table structural borders |
 * | Text primary | `--admin-ink` | `text-admin-ink` | Headings, values, table body |
 * | Text secondary | `--admin-ink-muted` | `text-admin-inkMuted` | Eyebrows, metadata, labels |
 * | Sidebar | `--admin-sidebar-surface` | `bg-admin-sidebarSurface` | Nav shell only |
 * | Primary action | `--admin-action-primary` | `bg-admin-actionPrimary` | Page CTAs, intro accent, focus rings |
 * | Liability | `--admin-semantic-liability` | `text-admin-semanticLiability` | Owed / outstanding money |
 * | Success | `--admin-status-success` | `text-admin-statusSuccess` | Profit, paid, positive trend |
 * | Success soft | `--admin-status-success-soft` | `bg-admin-statusSuccessSoft` | Legacy badges / chips |
 * | Warning | `--admin-status-warning` | `text-admin-statusWarning` | Attention, owed emphasis |
 * | Warning soft | `--admin-status-warning-soft` | `bg-admin-statusWarningSoft` | Alert banners |
 * | Info | `--admin-status-info` | `text-admin-statusInfo` | Informational status |
 * | Icon well green | `--admin-semantic-green-surface` | `bg-admin-semanticGreenSurface` | Money, profit, cash-positive |
 * | Icon well amber | `--admin-semantic-amber-surface` | `bg-admin-semanticAmberSurface` | Obligations, vendors, purchases, owed |
 * | Icon well blue | `--admin-semantic-blue-surface` | `bg-admin-semanticBlueSurface` | Open, in-progress, needs attention |
 * | Icon well clay | `--admin-semantic-clay-surface` | `bg-admin-semanticClaySurface` | Neutral, completed, archived, historical |
 * | KPI default | `--admin-kpi-soft` | `bg-admin-kpiSoft` | Default KPI tile wash |
 * | KPI emphasis | `--admin-kpi-accent` | `bg-admin-kpiAccent` | Liability / owed KPI |
 * | KPI milestone | `--admin-kpi-gold` | `bg-admin-kpiGold` | Completed / milestone |
 * | KPI attention | `--admin-kpi-sage` | `bg-admin-kpiSage` | Ops / review counts |
 *
 * Legacy `admin-brand` (rose) is deprecated for new UI — use `admin-actionPrimary`.
 * Prefer `admin-ink` / `stone-*` over raw `gray-*` in workspace surfaces.
 */

// ---------------------------------------------------------------------------
// Typography — semantic tokens (top-level workspace pages)
// ---------------------------------------------------------------------------

/**
 * | Token | Use |
 * |-------|-----|
 * | {@link WORKSPACE_PAGE_TITLE} | Page H1 — Dashboard, Shows, Vendors, Purchases, Business Health |
 * | {@link WORKSPACE_PAGE_SUBTITLE} | Welcome / supporting line under page title |
 * | {@link WORKSPACE_SECTION_EYEBROW} | THIS WEEK (dashboard hero), in-card labels |
| {@link WORKSPACE_PAGE_CHROME_INSET_X} | Page titles, subtitles, section eyebrows (+6–8px of gutter) |
| {@link WORKSPACE_PAGE_SECTION_EYEBROW} | Page-level anchors — WORKSPACE OVERVIEW (typography + chrome inset) |
 * | {@link WORKSPACE_CARD_TITLE} | Hub cards, rails, WorkspaceCardHeader default |
 * | {@link WORKSPACE_WEEK_SECTION_TITLE} | Shows index week panel headings (This week, Past weeks) |
 * | {@link WORKSPACE_LABEL} | Uppercase KPI / metric labels (Profit, Vendor balances, …) |
 * | {@link WORKSPACE_LABEL_FIELD} | Sentence-case row labels (summary rows, table meta) |
 * | {@link WORKSPACE_LABEL_CAPTION} | Caption under strip metrics (xs, below value) |
 * | {@link WORKSPACE_VALUE} | Counts, dates, default values |
 * | {@link WORKSPACE_VALUE_MONEY} | Currency base — pair with `workspaceMoney*` semantic classes |
 * | {@link WORKSPACE_VALUE_KPI} | Summary stat / hub KPI figures |
 * | {@link WORKSPACE_VALUE_KPI_HERO} | Lead strip metric (e.g. total outstanding) |
 */

/** Page H1 — `WorkspacePageHeader`, legacy `AdminPageIntro`. */
export const WORKSPACE_PAGE_TITLE =
  'min-w-0 text-xl font-semibold tracking-tight text-admin-ink sm:text-2xl';

/** Supporting line under page title. */
export const WORKSPACE_PAGE_SUBTITLE =
  'max-w-prose text-sm font-medium leading-relaxed text-admin-inkMuted';

/** Section anchor — uppercase eyebrows above modules or inside hero cards. */
export const WORKSPACE_SECTION_EYEBROW =
  'text-[11px] font-semibold uppercase tracking-wider text-admin-inkMuted';

/**
 * Page-level section anchor (outside bordered cards) — e.g. WORKSPACE OVERVIEW.
 * Typography + {@link WORKSPACE_PAGE_CHROME_INSET_X}. Do not use inside hub cards.
 */
export const WORKSPACE_PAGE_SECTION_EYEBROW = [
  WORKSPACE_SECTION_EYEBROW,
  WORKSPACE_PAGE_CHROME_INSET_X,
].join(' ');

/** Card / rail / module title inside a bordered surface. */
export const WORKSPACE_CARD_TITLE =
  'text-base font-semibold tracking-tight text-admin-ink';

/**
 * Week panel heading on Shows index (`This week`, `Past weeks`) — larger than
 * {@link WORKSPACE_CARD_TITLE}; dashboard week copy uses {@link WORKSPACE_SECTION_EYEBROW}.
 */
export const WORKSPACE_WEEK_SECTION_TITLE =
  'text-lg font-semibold tracking-tight text-admin-ink sm:text-xl';

/** Uppercase KPI / metric label (embedded cells, stat tiles). */
export const WORKSPACE_LABEL = WORKSPACE_SECTION_EYEBROW;

/** Sentence-case label in summary rows and table meta columns. */
export const WORKSPACE_LABEL_FIELD = 'text-sm text-admin-inkMuted';

/** Caption below strip metrics (label under the value). */
export const WORKSPACE_LABEL_CAPTION =
  'text-xs font-medium leading-snug text-admin-inkMuted';

/** Default value — counts, dates, body values in rows. */
export const WORKSPACE_VALUE =
  'text-sm font-medium leading-snug text-admin-ink';

/** Muted value variant. */
export const WORKSPACE_VALUE_MUTED =
  'text-sm font-medium leading-snug text-admin-inkMuted';

/** Currency / financial value base — add `workspaceMoneyTabular` + semantic color. */
export const WORKSPACE_VALUE_MONEY =
  'text-sm font-semibold tabular-nums leading-snug text-admin-ink';

/** KPI figure in summary tiles and hub overview rows. */
export const WORKSPACE_VALUE_KPI =
  'text-xl font-bold tabular-nums tracking-tight text-admin-ink sm:text-[1.625rem] sm:leading-snug';

/** Lead metric in obligation / activity strips. */
export const WORKSPACE_VALUE_KPI_HERO =
  'text-2xl font-semibold tabular-nums tracking-tight text-admin-ink sm:text-3xl';

/** Strip metric (secondary emphasis) — totals row below hero. */
export const WORKSPACE_VALUE_STRIP =
  'text-base font-semibold tabular-nums tracking-tight text-admin-ink sm:text-lg';

// ---------------------------------------------------------------------------
// Typography — legacy TYPE_* aliases (prefer semantic tokens above)
// ---------------------------------------------------------------------------

/** @deprecated Prefer {@link WORKSPACE_PAGE_TITLE}. */
export const WORKSPACE_TYPE_PAGE_TITLE =
  'text-xl font-semibold tracking-tight text-admin-ink sm:text-2xl';

/** @deprecated Prefer {@link WORKSPACE_CARD_TITLE}. */
export const WORKSPACE_TYPE_SECTION_TITLE = WORKSPACE_CARD_TITLE;

/** @deprecated Prefer {@link WORKSPACE_SECTION_EYEBROW} or {@link WORKSPACE_LABEL}. */
export const WORKSPACE_TYPE_EYEBROW = WORKSPACE_SECTION_EYEBROW;

/** Body — default readable copy. */
export const WORKSPACE_TYPE_BODY = 'text-sm leading-snug text-admin-ink';

/** Meta — secondary lines, table cell metadata, helper text. */
export const WORKSPACE_TYPE_META = WORKSPACE_LABEL_CAPTION;

/** @deprecated Prefer {@link WORKSPACE_VALUE_KPI}. */
export const WORKSPACE_TYPE_KPI_VALUE = WORKSPACE_VALUE_KPI;

/** @deprecated Prefer {@link WORKSPACE_VALUE_KPI_HERO}. */
export const WORKSPACE_TYPE_KPI_HERO = WORKSPACE_VALUE_KPI_HERO;

/** Table header label. */
export const WORKSPACE_TYPE_TABLE_HEAD = WORKSPACE_SECTION_EYEBROW;

// ---------------------------------------------------------------------------
// Spacing (8px grid — `--fefe-space-*` / Tailwind `fefe-*`)
// ---------------------------------------------------------------------------

/**
 * | Token | px | Tailwind | Use |
 * |-------|-----|----------|-----|
 * | space-1 | 8 | `fefe-1` / `p-2` | Chip gaps, tight toolbar |
 * | space-2 | 16 | `fefe-2` / `p-4` | Card padding mobile, toolbar |
 * | space-3 | 24 | `fefe-3` / `p-6` | Card padding desktop |
 * | space-4 | 32 | `fefe-4` | Section internal gaps |
 * | space-5 | 48 | `fefe-5` | Large section breaks |
 */
export const WORKSPACE_SPACE = {
  cardPadding: 'p-4 sm:p-5',
  cardPaddingCompact: 'p-3 sm:p-4',
  sectionGap: 'gap-7 md:gap-8',
  toolbarGap: 'gap-2 sm:gap-3',
  tableCellY: 'py-3 sm:py-3.5',
  tableCellX: 'px-4 sm:px-5',
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const WORKSPACE_RADIUS = {
  sm: 'rounded-workspace-sm',
  md: 'rounded-workspace-md',
  lg: 'rounded-workspace-lg',
  xl: 'rounded-workspace-xl',
  /** Default card / KPI tile radius (A1). */
  card: 'rounded-workspace-lg',
  pill: 'rounded-full',
} as const;

// ---------------------------------------------------------------------------
// Elevation
// ---------------------------------------------------------------------------

export const WORKSPACE_ELEVATION = {
  /** Flat ledger/history surfaces — no lift. */
  flat: '',
  /** Nested panels, pills, date picker. */
  sm: 'shadow-workspace-surface-warm-sm',
  /** Default cards and KPI tiles. */
  md: 'shadow-workspace-surface-warm',
  /** Primary liability tables, hero modules. */
  lg: 'shadow-[0_4px_28px_-14px_rgba(120,113,108,0.16)]',
} as const;

// ---------------------------------------------------------------------------
// Focus
// ---------------------------------------------------------------------------

/** Single focus-ring treatment for all workspace interactive controls. */
export const WORKSPACE_FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/50';

export const WORKSPACE_FOCUS_RING_INSET =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-actionPrimary/45';

// ---------------------------------------------------------------------------
// Semantic colors (action vs liability vs trend — do not conflate)
// ---------------------------------------------------------------------------

/** Filled buttons, intro accent rails, breadcrumb links, focus rings. */
export const WORKSPACE_SEMANTIC_ACTION = 'text-admin-actionPrimary';

/** Outstanding balances, vendor owed amounts. */
export const WORKSPACE_SEMANTIC_LIABILITY = 'text-admin-semanticLiability';

/** Signed losses, negative profit (not the same as action CTAs). */
export const WORKSPACE_SEMANTIC_LOSS = 'text-admin-semanticLiability';

/** Comparison / trend copy — favorable. */
export const WORKSPACE_TREND_POSITIVE = 'text-admin-statusSuccess';

/** Comparison / trend copy — unfavorable (vendor outstanding up, profit down). */
export const WORKSPACE_TREND_NEGATIVE = 'text-admin-semanticLiability';

/** Comparison / trend copy — flat / no prior period. */
export const WORKSPACE_TREND_NEUTRAL = 'text-admin-inkMuted';

// ---------------------------------------------------------------------------
// Money semantics (A1)
// ---------------------------------------------------------------------------

export const WORKSPACE_MONEY_POSITIVE = WORKSPACE_TREND_POSITIVE;
/** @deprecated Prefer {@link WORKSPACE_SEMANTIC_LIABILITY} for owed; {@link WORKSPACE_SEMANTIC_LOSS} for signed loss. */
export const WORKSPACE_MONEY_NEGATIVE = WORKSPACE_SEMANTIC_LOSS;
export const WORKSPACE_MONEY_LIABILITY = WORKSPACE_SEMANTIC_LIABILITY;
export const WORKSPACE_MONEY_NEUTRAL = 'text-admin-ink';
export const WORKSPACE_MONEY_MUTED = 'text-admin-inkMuted/70';
export const WORKSPACE_MONEY_TABULAR = 'tabular-nums';

// ---------------------------------------------------------------------------
// Layout — shell gutters (shared with page frame)
// ---------------------------------------------------------------------------

export {
  WORKSPACE_CONTAINER_GUTTER,
  WORKSPACE_CONTAINER_INSET_X,
  WORKSPACE_PAGE_CHROME_INSET_X,
};

/** Hub / card interior horizontal rhythm — mirrors shell gutter. */
export const WORKSPACE_PAD_X = WORKSPACE_CONTAINER_GUTTER;

/**
 * Gap between sidebar and content panels — row underlay shows through so both
 * rounded edges read as adjacent fitted panels (no overlap/z-index hacks).
 */
export const WORKSPACE_SHELL_PANEL_GAP = 'gap-px';

/**
 * Sidebar clay panel seam — radius on the element that paints the gradient
 * ({@link workspaceSidebarPanel} `<aside>`). Right edge only; left flush to viewport.
 */
export const WORKSPACE_SHELL_SIDEBAR_PANEL = [
  'max-md:rounded-r-none md:rounded-r-xl',
  'overflow-hidden',
].join(' ');

/**
 * Content canvas panel — radius + fill on {@link workspaceShellColumn}. Left edge
 * only; right edge square. Intro/page layers must not repaint {@code bg-admin-canvas}
 * or they will square off the seam corners.
 */
export const WORKSPACE_SHELL_CONTENT_PANEL = [
  'max-md:rounded-l-none md:rounded-l-xl',
  'bg-admin-canvas',
  'self-stretch',
  'overflow-hidden',
].join(' ');

/** @deprecated Prefer {@link WORKSPACE_SHELL_CONTENT_PANEL}. */
export const WORKSPACE_SHELL_CONTENT_CANVAS_SEAM = 'md:rounded-l-xl';

// ---------------------------------------------------------------------------
// Card shells
// ---------------------------------------------------------------------------

export const WORKSPACE_CARD_SHELL = [
  WORKSPACE_RADIUS.card,
  'border border-admin-border/95',
  'bg-admin-surfaceElevated',
  WORKSPACE_ELEVATION.md,
].join(' ');

export const WORKSPACE_PANEL_SHELL = [
  WORKSPACE_RADIUS.card,
  'border border-admin-border/95',
  'bg-admin-surfaceElevated',
  WORKSPACE_ELEVATION.sm,
].join(' ');

/** Hub modules — dashboard overview, trend strip, future BH summary cards. */
export const WORKSPACE_HUB_CARD_SHELL = [
  'min-w-0 w-full overflow-hidden',
  WORKSPACE_RADIUS.xl,
  'border border-admin-border/90',
  'bg-admin-surfaceElevated',
  WORKSPACE_ELEVATION.lg,
].join(' ');

export const WORKSPACE_HUB_CARD_HEADER = [
  WORKSPACE_PAD_X,
  'border-0 bg-transparent pb-1 pt-5 sm:pt-6',
].join(' ');

/** Body padding for hub destination cards — airy, not table-like. */
export const WORKSPACE_HUB_CARD_BODY = [WORKSPACE_PAD_X, 'pb-2 pt-1'].join(' ');

/** Footer padding for hub cards — no structural divider. */
export const WORKSPACE_HUB_CARD_FOOTER = [
  WORKSPACE_PAD_X,
  'border-0 pb-5 pt-4 sm:pb-6',
].join(' ');

/** Key-value rows inside hub / overview cards (legacy table rows). */
export const WORKSPACE_SUMMARY_ROWS =
  'divide-y divide-admin-border/50 border-y border-admin-border/50';

/** Borderless summary stack for hub destination cards. */
export const WORKSPACE_SUMMARY_STACK = 'flex flex-col gap-3 sm:gap-3.5';

// ---------------------------------------------------------------------------
// Illustrated hub card layout (locked geometry — Phase 3 artwork targets this frame)
// ---------------------------------------------------------------------------

/**
 * Illustrated hub card layout contract (raster PNG):
 *
 * | Region | Role |
 * |--------|------|
 * | Header | Icon + title |
 * | Body | `grid-cols-[1fr_7rem]` — metrics left, fixed illustration right, `items-center` |
 * | Footer | CTA anchored with `mt-auto` on equal-height cards |
 *
 * Illustration is centered against the body metrics block only (footer excluded).
 */

/** Body shell when an illustration slot is used. */
export const WORKSPACE_ILLUSTRATED_CARD_BODY = [
  WORKSPACE_HUB_CARD_BODY,
  'flex min-h-0 flex-1 flex-col',
].join(' ');

/** SVG body grid — illustration hidden below md. */
export const WORKSPACE_ILLUSTRATED_CARD_CONTENT_GRID =
  'grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_5.75rem] lg:grid-cols-[minmax(0,1fr)_6.25rem] md:items-start md:gap-3 lg:gap-4';

/** Primary content column — summary rows or custom children. */
export const WORKSPACE_ILLUSTRATED_CARD_CONTENT = 'min-w-0';

/**
 * Fixed SVG illustration frame — consistent footprint for all hub cards.
 * 5.75rem × 4.625rem (md) → ~28–32% of typical half-grid card width.
 */
export const WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME = [
  'pointer-events-none hidden shrink-0 md:flex',
  'h-[4.625rem] w-[5.75rem] lg:h-[5rem] lg:w-[6.25rem]',
  'items-center justify-center',
  'text-admin-inkMuted/30',
  '[&_svg]:block [&_svg]:h-full [&_svg]:w-full',
].join(' ');

/** @deprecated Prefer {@link WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME}. */
export const WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION =
  WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME;

/** Standard SVG viewBox — Phase 3 artwork should match this aspect ratio. */
export const WORKSPACE_ILLUSTRATION_VIEWBOX = '0 0 88 72';

/**
 * Raster body grid — metrics + illustration share one centerline.
 * Same rhythm on all four overview cards; slot width fixed per breakpoint.
 */
export const WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID = [
  'grid min-h-0 w-full flex-1',
  'grid-cols-[minmax(0,1fr)_5.5rem] sm:grid-cols-[minmax(0,1fr)_6.5rem] md:grid-cols-[minmax(0,1fr)_7rem]',
  'items-center gap-3 sm:gap-4',
].join(' ');

/** @deprecated Prefer {@link WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID}. */
export const WORKSPACE_ILLUSTRATED_CARD_RASTER_CONTENT_GRID =
  WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID;

/**
 * Fixed raster illustration slot — h-28 × w-32 on sm+; slightly smaller on xs.
 * Identical on every card; never per-image positioning.
 */
export const WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME = [
  'pointer-events-none relative shrink-0',
  'flex h-24 w-[6.5rem] items-center justify-center',
  'sm:h-28 sm:w-32',
].join(' ');

/** Raster image — contained inside slot, never cropped or stretched. */
export const WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE =
  'h-auto w-auto max-h-full max-w-full object-contain object-center';

/**
 * Empty-state raster slot — page-level sections (centered, larger than hub cards).
 * Pair with {@link WorkspaceIllustrationImage} `size="empty"`.
 */
export const WORKSPACE_EMPTY_STATE_RASTER_IMAGE_FRAME = [
  'pointer-events-none relative mx-auto shrink-0',
  'flex h-40 w-44 items-center justify-center',
  'sm:h-48 sm:w-52 md:h-52 md:w-56',
].join(' ');

/** Empty-state raster image — same contain rules as hub cards. */
export const WORKSPACE_EMPTY_STATE_RASTER_IMAGE =
  WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE;

// ---------------------------------------------------------------------------
// Embedded KPI grid (unified cells inside one card — not tinted tiles)
// ---------------------------------------------------------------------------

export const WORKSPACE_KPI_EMBEDDED_GRID =
  'grid grid-cols-2 divide-y divide-admin-border/30 lg:grid-cols-4 lg:divide-x lg:divide-y-0';

export const WORKSPACE_KPI_EMBEDDED_CELL = [
  'flex min-h-full min-w-0 flex-col',
  WORKSPACE_PAD_X,
  'py-6 sm:py-7',
].join(' ');

export const WORKSPACE_KPI_EMBEDDED_CELL_LEAD = [
  'flex min-h-full min-w-0 flex-col',
  WORKSPACE_PAD_X,
  'py-7 sm:py-8 lg:py-9',
].join(' ');

// ---------------------------------------------------------------------------
// Semantic icon wells (circular chips on cards / KPI cells / alert bands)
// ---------------------------------------------------------------------------

/** Shared geometry — filled circular chip; no outline ring (color carries semantics). */
export const WORKSPACE_ICON_WELL_SHELL =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11';

/** Green — money, profit, cash-positive outcomes. */
export const WORKSPACE_ICON_WELL_GREEN = [
  WORKSPACE_ICON_WELL_SHELL,
  'bg-admin-semanticGreenSurface text-admin-statusSuccess',
].join(' ');

/** Amber — obligations, vendors, purchases, balances owed. */
export const WORKSPACE_ICON_WELL_AMBER = [
  WORKSPACE_ICON_WELL_SHELL,
  'bg-admin-semanticAmberSurface text-admin-semanticLiability',
].join(' ');

/** Blue — active, open, in-progress, workflow attention. */
export const WORKSPACE_ICON_WELL_BLUE = [
  WORKSPACE_ICON_WELL_SHELL,
  'bg-admin-semanticBlueSurface text-admin-statusInfo',
].join(' ');

/** Clay — neutral, completed, archived, historical. */
export const WORKSPACE_ICON_WELL_CLAY = [
  WORKSPACE_ICON_WELL_SHELL,
  'bg-admin-semanticClaySurface text-admin-inkMuted',
].join(' ');

/**
 * Variant → semantic surface (single source for {@link WorkspaceIconWell} + summary stat chips).
 */
export const WORKSPACE_ICON_WELL_BY_VARIANT = {
  success: WORKSPACE_ICON_WELL_GREEN,
  liability: WORKSPACE_ICON_WELL_AMBER,
  attention: WORKSPACE_ICON_WELL_BLUE,
  milestone: WORKSPACE_ICON_WELL_CLAY,
  sage: WORKSPACE_ICON_WELL_CLAY,
  neutral: WORKSPACE_ICON_WELL_CLAY,
} as const;

// ---------------------------------------------------------------------------
// Alert bands (calm / attention status under KPI blocks)
// ---------------------------------------------------------------------------

/**
 * Neutral inset shell — warm clay wash distinct from canvas/cards; semantics
 * live in the icon well and key values only (shared across workspace pages).
 */
const WORKSPACE_ALERT_BAND_NEUTRAL_SHELL = [
  `${WORKSPACE_CONTAINER_INSET_X} mb-4 rounded-workspace-lg border border-admin-border/85 bg-admin-alertBandSurface`,
].join(' ');

/** Body copy inside alert bands — workspace neutral, not semantic wash. */
export const WORKSPACE_ALERT_BAND_TEXT = 'text-sm leading-snug text-admin-ink';

/** Outstanding monetary amounts inside attention bands (owed / liability). */
export const WORKSPACE_ALERT_BAND_ATTENTION_VALUE = [
  WORKSPACE_SEMANTIC_LIABILITY,
  'tabular-nums font-medium',
].join(' ');

export const WORKSPACE_ALERT_BAND_CALM = [
  WORKSPACE_ALERT_BAND_NEUTRAL_SHELL,
  `${WORKSPACE_PAD_X} py-3.5 ${WORKSPACE_ALERT_BAND_TEXT} sm:mb-5`,
].join(' ');

/**
 * Outstanding operational / financial work (e.g. needs close-out) — neutral
 * clay surface; amber icon well + highlighted owed amounts carry semantics.
 */
export const WORKSPACE_ALERT_BAND_ATTENTION = [
  `${WORKSPACE_ALERT_BAND_NEUTRAL_SHELL} flex items-center gap-2.5`,
  `${WORKSPACE_PAD_X} py-3.5 ${WORKSPACE_ALERT_BAND_TEXT} sm:mb-5`,
].join(' ');

/** Actionable alert band — full-row link; pairs with {@link WORKSPACE_ALERT_BAND_ATTENTION}. */
export const WORKSPACE_ALERT_BAND_LINK =
  'cursor-pointer text-inherit no-underline outline-none transition-colors hover:bg-admin-surfaceHover/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/40';

// ---------------------------------------------------------------------------
// Metric trend strip (MTD / comparison row)
// ---------------------------------------------------------------------------

export const WORKSPACE_TREND_STRIP_SHELL = [
  WORKSPACE_RADIUS.xl,
  'border border-admin-border/90',
  'bg-admin-surfaceElevated',
  WORKSPACE_ELEVATION.sm,
  `${WORKSPACE_PAD_X} py-4 sm:py-4`,
].join(' ');

export const WORKSPACE_TREND_ITEMS_GRID =
  'grid grid-cols-1 divide-y divide-admin-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0';

export const WORKSPACE_TREND_ITEM_CELL =
  'min-w-0 px-0 py-3 first:pt-0 last:pb-0 sm:px-4 sm:py-1 sm:first:pl-0 sm:last:pr-0';

export const WORKSPACE_TREND_ITEM_LABEL = WORKSPACE_TYPE_EYEBROW;

export const WORKSPACE_TREND_ITEM_VALUE =
  'text-lg font-semibold tabular-nums tracking-tight text-admin-ink sm:text-xl';

export const WORKSPACE_TREND_ITEM_HELPER = WORKSPACE_TYPE_META;
