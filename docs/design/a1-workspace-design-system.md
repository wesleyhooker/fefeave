# A1 Warm Clay — Reseller Workspace Design System

Visual direction: **WARM CLAY (Refined Current + Warmth)** — boutique, operational, trustworthy.

This document is the foundation for the `/admin/*` reseller workspace. It does **not** implement the Dashboard page; Dashboard becomes the reference implementation in the next phase.

**Primitives barrel:** `frontend/app/(admin)/admin/_components/workspace/index.ts`  
**Token module:** `frontend/app/(admin)/admin/_lib/workspaceDesignTokens.ts`  
**CSS variables:** `frontend/system/tokens.css`  
**Composed classes:** `frontend/app/(admin)/admin/_components/workspaceUi.ts`

---

## 1. Design-token plan

### Color system (unified)

| Semantic role    | CSS variable                     | Tailwind                        | Hex (A1)                                 |
| ---------------- | -------------------------------- | ------------------------------- | ---------------------------------------- |
| Canvas           | `--admin-canvas`                 | `bg-admin-canvas`               | `#FAF9F6`                                |
| Surface elevated | `--admin-surface-elevated`       | `bg-admin-surfaceElevated`      | `#FFFFFF`                                |
| Surface inset    | `--admin-muted-strip`            | `bg-admin-mutedStrip`           | `#F5F1EB`                                |
| Border           | `--admin-border`                 | `border-admin-border`           | `#E0D6CC`                                |
| Text primary     | `--admin-ink`                    | `text-admin-ink`                | `#2D2926`                                |
| Text secondary   | `--admin-ink-muted`              | `text-admin-inkMuted`           | `#6B6560`                                |
| Sidebar          | `--admin-sidebar-surface`        | `bg-admin-sidebarSurface`       | `#A35F4D`                                |
| Sidebar deep     | `--admin-sidebar-surface-deep`   | `bg-admin-sidebarSurfaceDeep`   | `#8F4A3A`                                |
| Primary action   | `--admin-action-primary`         | `bg-admin-actionPrimary`        | `#9C3023`                                |
| Action hover     | `--admin-action-primary-hover`   | `bg-admin-actionPrimaryHover`   | `#8A2A1F`                                |
| Liability / owed | `--admin-semantic-liability`     | `text-admin-semanticLiability`  | `#B45309`                                |
| Success / profit | `--admin-status-success`         | `text-admin-statusSuccess`      | `#2D5A27`                                |
| Success soft     | `--admin-status-success-soft`    | `bg-admin-statusSuccessSoft`    | `#E8F0E4`                                |
| Warning / active | `--admin-status-warning`         | `text-admin-statusWarning`      | `#B45309`                                |
| Warning soft     | `--admin-status-warning-soft`    | `bg-admin-statusWarningSoft`    | `#FEF3E2`                                |
| Info             | `--admin-status-info`            | `text-admin-statusInfo`         | `#1D4ED8`                                |
| Icon well green  | `--admin-semantic-green-surface` | `bg-admin-semanticGreenSurface` | Money, profit, cash-positive             |
| Icon well amber  | `--admin-semantic-amber-surface` | `bg-admin-semanticAmberSurface` | Obligations, vendors, purchases, owed    |
| Icon well blue   | `--admin-semantic-blue-surface`  | `bg-admin-semanticBlueSurface`  | Open, in-progress, needs attention       |
| Icon well clay   | `--admin-semantic-clay-surface`  | `bg-admin-semanticClaySurface`  | Neutral, completed, archived, historical |
| KPI default      | `--admin-kpi-soft`               | `bg-admin-kpiSoft`              | `#FCE8DC`                                |
| KPI emphasis     | `--admin-kpi-accent`             | `bg-admin-kpiAccent`            | `#F9D5C8`                                |
| KPI milestone    | `--admin-kpi-gold`               | `bg-admin-kpiGold`              | `#FDF0D4`                                |
| KPI attention    | `--admin-kpi-sage`               | `bg-admin-kpiSage`              | `#D4DFC8`                                |

**Palette drift policy**

- **Deprecated for new UI:** `admin-brand` (legacy rose), raw `gray-*` on workspace surfaces
- **Preferred neutrals:** `admin-ink`, `admin-inkMuted`, `stone-*` where semantic tokens are not yet wired
- **Money:** `admin-statusSuccess` (positive), `admin-semanticLiability` (owed / negative trend / loss), `admin-ink` (neutral)
- **Actions:** `admin-actionPrimary` (CTAs, focus rings, links) — **not** liability semantics
- **Public site:** `--fefe-*` unchanged; admin tokens are additive

### Typography scale (semantic tokens)

Source: `frontend/app/(admin)/admin/_lib/workspaceDesignTokens.ts` — re-exported from `workspaceUi.ts`.

| Role              | Token                          | Use                                                                              |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Page title        | `WORKSPACE_PAGE_TITLE`         | Dashboard, Shows, Vendors, Purchases, Business Health — `WorkspacePageHeader` H1 |
| Page subtitle     | `WORKSPACE_PAGE_SUBTITLE`      | Welcome back…, Run this week's shows…, Manage vendor balances…                   |
| Section eyebrow   | `WORKSPACE_SECTION_EYEBROW`    | THIS WEEK (dashboard hero), WORKSPACE OVERVIEW, MONTHLY SNAPSHOT                 |
| Week panel title  | `WORKSPACE_WEEK_SECTION_TITLE` | Shows index — This week, Past weeks (larger than card title)                     |
| Card title        | `WORKSPACE_CARD_TITLE`         | Hub cards, rails, `WorkspaceCardHeader` — Shows, Vendors, Purchases, …           |
| Label (uppercase) | `WORKSPACE_LABEL`              | KPI eyebrows — Profit, Vendor balances, Completed shows                          |
| Label (field)     | `WORKSPACE_LABEL_FIELD`        | Summary row labels, table meta columns                                           |
| Label (caption)   | `WORKSPACE_LABEL_CAPTION`      | Helper text, strip metric captions, trend deltas                                 |
| Value             | `WORKSPACE_VALUE`              | Counts, dates, default row values                                                |
| Value (muted)     | `WORKSPACE_VALUE_MUTED`        | Muted values, week date context lines                                            |
| Money value       | `WORKSPACE_VALUE_MONEY`        | Currency base — pair with `workspaceMoney*` semantic classes                     |
| KPI value         | `WORKSPACE_VALUE_KPI`          | Summary stat tiles, BH summary metrics                                           |
| KPI hero          | `WORKSPACE_VALUE_KPI_HERO`     | Lead strip metric (total outstanding, invested totals)                           |
| Strip value       | `WORKSPACE_VALUE_STRIP`        | Secondary strip metrics                                                          |

**Legacy aliases:** `WORKSPACE_TYPE_*` names remain as thin re-exports; prefer semantic tokens above.

**Font policy:** Inter (`font-fefe`) for all workspace UI. Playfair (`font-fefe-heading`) reserved for brand wordmark only.

### Spacing scale (8px grid)

| Token                | px  | Use                          |
| -------------------- | --- | ---------------------------- |
| `fefe-1` / `space-1` | 8   | Chip gaps                    |
| `fefe-2`             | 16  | Card padding mobile, toolbar |
| `fefe-3`             | 24  | Card padding desktop         |
| `fefe-4`             | 32  | Section gaps                 |
| `fefe-5`             | 48  | Large breaks                 |

**Rhythm:** `workspacePageContentStack` = `gap-7 md:gap-8`; card padding = `p-4 sm:p-5`.

### Illustrated hub card layout (`WorkspaceIllustratedCard`)

Locked geometry in `workspaceDesignTokens.ts`.

| Token                                           | Role                                                         |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `WORKSPACE_ILLUSTRATED_CARD_BODY`               | Flex body (`flex-1`) when illustration present               |
| `WORKSPACE_ILLUSTRATED_CARD_RASTER_BODY_GRID`   | `grid-cols-[1fr_7rem] items-center` — metrics + illustration |
| `WORKSPACE_ILLUSTRATED_CARD_CONTENT`            | Primary summary / children column                            |
| `WORKSPACE_ILLUSTRATED_CARD_RASTER_IMAGE_FRAME` | Fixed `h-28 w-32` slot (sm+), `object-contain` image         |
| `WORKSPACE_ILLUSTRATED_CARD_ILLUSTRATION_FRAME` | SVG frame (md+), hidden below `md`                           |

**Structure:** header (icon + title) → body grid (copy + illustration, vertically centered as a pair) → footer CTA (`mt-auto`).

### Radius

| Token                 | px     | Tailwind               |
| --------------------- | ------ | ---------------------- |
| sm                    | 6      | `rounded-workspace-sm` |
| md                    | 8      | `rounded-workspace-md` |
| **lg (default card)** | **12** | `rounded-workspace-lg` |
| xl                    | 16     | `rounded-workspace-xl` |

### Elevation

| Tier | Token                              | Use                    |
| ---- | ---------------------------------- | ---------------------- |
| flat | —                                  | Ledger rows, history   |
| sm   | `shadow-workspace-surface-warm-sm` | Nested panels          |
| md   | `shadow-workspace-surface-warm`    | Default cards          |
| lg   | custom stone lift                  | Financial index tables |

### Focus

Single ring for all interactive controls:

```
WORKSPACE_FOCUS_RING = outline-admin-actionPrimary/50, 2px, offset 2
```

Exported from `workspaceDesignTokens.ts` and re-exported via `workspaceUi.ts`.

---

## 2. Component inventory

| Primitive                                               | Status                          | Wraps / replaces                                                                                 |
| ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `WorkspaceCard`                                         | **Existing** (tokens updated)   | `workspaceCard` shell                                                                            |
| `WorkspaceButton`                                       | **New**                         | `workspaceAction*` tokens                                                                        |
| `WorkspaceMetricStrip`                                  | **New**                         | Duplicated `StripMetric` in Vendors/Purchases                                                    |
| `WorkspaceKpiTile` / `WorkspaceKpiGrid`                 | **New**                         | `AdminSummaryStatGrid` pattern                                                                   |
| `WorkspaceStatus`                                       | **New**                         | `ShowStatusPill`, `WorkspaceListShowStatus`, payment/settlement                                  |
| `WorkspaceSectionHeader`                                | **New**                         | `WorkspaceCardHeader` + eyebrow variant                                                          |
| `WorkspaceToolbar`                                      | **New** (thin wrap)             | `AdminWorkspaceToolbar`                                                                          |
| `WorkspaceTable`                                        | **New**                         | Ad-hoc table shells + `workspaceBalancesPrimaryTableShell`                                       |
| `WorkspaceEmptyState`                                   | **Existing**                    | —                                                                                                |
| `WorkspaceHistoryLink`                                  | **New**                         | `PurchasesViewHistoryLink`, owner/vendor history links                                           |
| `WorkspaceRightPanel`                                   | **New** (re-export)             | `WorkspacePageWithRightPanel`                                                                    |
| `WorkspaceIconWell`                                     | **Shared**                      | Circular semantic chips — `WORKSPACE_ICON_WELL_*` tokens; hero, overview, KPI tiles, alert bands |
| `WorkspaceAlertBand`                                    | **New** (foundation patch)      | Dashboard hero status band                                                                       |
| `WorkspaceKpiEmbeddedCell` / `WorkspaceKpiEmbeddedGrid` | **New** (foundation patch)      | Dashboard week hero KPI grid                                                                     |
| `WorkspaceSummaryRow`                                   | **New** (foundation patch)      | Hub overview key-value rows                                                                      |
| `WorkspaceIllustratedCard`                              | **New**                         | Hub destination cards with optional illustration frame                                           |
| `WorkspaceRowChevron`                                   | **Promoted** (foundation patch) | Navigational row affordance                                                                      |

**Not in primitives barrel (layout / shell — unchanged):**

- `AdminWorkspacePageLayout`, `AdminPageIntro`, `WorkspaceGrid`, `AdminSidebar`, `WorkspaceHeader`

---

## 3. Component ownership map

```text
frontend/system/tokens.css          → CSS variables (color, radius)
frontend/tailwind.config.ts       → Tailwind admin.* + workspace radius
frontend/app/(admin)/admin/_lib/
  workspaceDesignTokens.ts          → Documented TS token constants (A1)
  workspacePageContentWidth.ts      → Container tiers (unchanged)
  workspaceLayoutGrid.ts            → Grid spans (unchanged)
  workspacePageRegions.ts           → Entity grids, right panel host (unchanged)
frontend/app/(admin)/admin/_components/
  workspaceUi.ts                    → Composed Tailwind strings (source of truth for classes)
  workspace/index.ts                → Public primitive API (import here for new code)
  workspace/Workspace*.tsx          → Primitive implementations
  WorkspaceCard.tsx                 → Card composition (existing)
  AdminWorkspaceToolbar.tsx         → Toolbar layout (existing, wrapped)
  WorkspacePageWithRightPanel.tsx   → Right panel host (existing, aliased)
  ShowStatusPill.tsx                → Legacy; consume via WorkspaceStatus
  WorkspaceListStatus.tsx           → Legacy; consume via WorkspaceStatus
  AdminSummaryStatGrid.tsx          → Legacy; migrate to WorkspaceKpiGrid
dashboard/_components/
  dashboardStructure.ts             → Thin aliases + Shows row tokens (deprecated re-exports)
  dashboard/_lib/dashboardA1Ui.ts   → Domain icon maps only (no Tailwind classes)
```

**Import rule for new code:**

```ts
import {
  WorkspaceCard,
  WorkspaceButton,
  WorkspaceKpiGrid,
  WorkspaceMetricStrip,
  WorkspaceStatus,
  WorkspaceTable,
  WorkspaceHistoryLink,
  WorkspaceRightPanel,
} from "@/app/(admin)/admin/_components/workspace";
```

---

## 4. Files affected

### Modified (foundation — this phase)

| File                                                    | Change                                                   |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `frontend/system/tokens.css`                            | A1 Warm Clay color values + radius vars + status tokens  |
| `frontend/tailwind.config.ts`                           | Status colors, workspace radius utilities                |
| `frontend/app/(admin)/admin/_components/workspaceUi.ts` | Card radius, money/status colors, nav active, re-exports |
| `frontend/app/(admin)/admin/README.md`                  | Pointer to design system                                 |
| `design/colors.md`                                      | Admin A1 token table                                     |

### Added (foundation — this phase)

| File                                                       | Purpose                         |
| ---------------------------------------------------------- | ------------------------------- |
| `frontend/app/(admin)/admin/_lib/workspaceDesignTokens.ts` | Token constants + documentation |
| `frontend/app/(admin)/admin/_components/workspace/*`       | Primitive components + barrel   |
| `docs/design/a1-workspace-design-system.md`                | This document                   |

### Not modified (page migration — future phases)

- `dashboard/_components/*` — Dashboard reference implementation (Phase 3)
- `balances/VendorsObligationStrip.tsx` — migrate to `WorkspaceMetricStrip`
- `purchases/PurchasesActivityStrip.tsx` — migrate to `WorkspaceMetricStrip`
- `purchases/PurchasesViewHistoryLink.tsx` — migrate to `WorkspaceHistoryLink`
- Detail views, table rows, forms — incremental token adoption

---

## 5. Refactor strategy

### Principles

1. **Tokens first** — CSS vars and `workspaceUi.ts` before page refactors
2. **Consolidate, don't replace** — primitives wrap existing token strings
3. **No workflow changes** — same routes, panels, tables, data
4. **One responsive system** — same components at 1080 / 1440 / wide / phone

### Phased rollout

| Phase                            | Scope                                            | Outcome                                         |
| -------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| **1 — Foundation** (this task)   | Tokens + primitives + docs                       | Stable API for all pages                        |
| **2 — Strip & status migration** | Vendors, Purchases, Shows status consumers       | Remove duplicated `StripMetric`; unified status |
| **3 — Dashboard reference**      | Apply primitives to `/admin/dashboard`           | Visual reference for all pages                  |
| **4 — Index pages**              | Shows, Vendors, Purchases, Business Health       | KPI strips, tables, toolbars                    |
| **5 — Detail + ledger**          | Show/vendor detail, financial activity           | Table variants, ledger flat surfaces            |
| **6 — Cleanup**                  | Deprecate legacy imports, remove dead components | `WorkspaceDrawer`, `ThisWeekPayoutHeroBlock`    |

### Per-pattern migration

| Pattern          | From                                                | To                                                  |
| ---------------- | --------------------------------------------------- | --------------------------------------------------- |
| Obligation strip | `VendorsObligationStrip` inline                     | `WorkspaceMetricStrip` + `WorkspaceMetricStripCell` |
| Activity strip   | `PurchasesActivityStrip` inline                     | Same                                                |
| KPI grid         | `AdminSummaryStatGrid`                              | `WorkspaceKpiGrid` (alias period)                   |
| History link     | `PurchasesViewHistoryLink`, etc.                    | `WorkspaceHistoryLink`                              |
| Show status      | Direct `ShowStatusPill` / `WorkspaceListShowStatus` | `WorkspaceStatus`                                   |
| Table shell      | Inline `workspaceBalancesPrimaryTableShell`         | `WorkspaceTable variant="financial"`                |

---

## 6. Risk assessment

| Risk                                               | Severity | Mitigation                                                                        |
| -------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| Global token shift changes all admin pages at once | Medium   | A1 values are refinements, not wholesale palette swap; spot-check Vendors + Shows |
| Dashboard hub diverges until Phase 3               | Low      | `dashboardStructure.ts` stays isolated; document intentional gap                  |
| `gray-*` still in forms/tables                     | Low      | Phase 4–5 grep migration; forms last (highest touch)                              |
| Operational rails hidden 768–1279px                | Medium   | Layout fix separate from foundation; stack rails in Phase 4                       |
| Terracotta liability + CTA same hue                | Low      | Liability uses text-only; CTA uses fill — distinct weight                         |
| Focus ring change on legacy buttons                | Low      | New `WORKSPACE_FOCUS_RING` exported; legacy rings migrate gradually               |
| Sidebar active state visual change                 | Low      | A1 white pill on clay; verify contrast on `#A35F4D`                               |
| No automated visual regression                     | Medium   | Manual viewport checklist per phase                                               |

---

## 7. Implementation plan

### Completed in this phase

- [x] A1 color tokens in `tokens.css`
- [x] Tailwind `admin.status*` + `rounded-workspace-*`
- [x] `workspaceDesignTokens.ts` typography, spacing, radius, elevation, focus
- [x] `workspaceUi.ts` card shell, money, status pill, page title alignment
- [x] Primitive components in `_components/workspace/`
- [x] Barrel export `workspace/index.ts`
- [x] Design system documentation

### Phase 3 — Dashboard reference (completed)

- [x] Dashboard hero metrics — A1 icon wells, `WorkspaceSectionHeader`, `WorkspaceButton`
- [x] Dashboard workspace overview — `WorkspaceCard`, `WorkspaceButton`, A1 icon tones
- [x] Dashboard trend strip — A1 token alignment
- [x] Global shell — sidebar brand (Playfair wordmark), nav active state polish
- [x] `dashboardStructure.ts` migrated to A1 hub surfaces
- [x] `dashboardA1Ui.ts` — shared icon/surface mappings for dashboard

### Foundation patch — promote dashboard patterns (completed)

Prevents `dashboardStructure.ts` / `dashboardA1Ui.ts` from becoming a parallel design system.

| Promoted primitive                  | Future consumers                                        |
| ----------------------------------- | ------------------------------------------------------- |
| `WorkspaceIconWell`                 | Vendors owed rows, Purchases activity, BH summary cards |
| `WorkspaceAlertBand`                | Vendors attention banners, Shows week status            |
| `WorkspaceKpiEmbeddedCell` / `Grid` | Business Health hero, Vendors obligation summary        |
| `WORKSPACE_HUB_CARD_SHELL`          | BH overview, Vendors hub cards, Purchases hub           |
| `WorkspaceSummaryRow`               | All hub overview key-value rows                         |
| `workspaceSidebarBrand*`            | Global shell only (already wired in `AdminSidebar`)     |
| `WorkspaceRowChevron`               | Navigational rows across index + detail pages           |

**Semantic color separation:** `--admin-action-primary` (CTA/focus) vs `--admin-semantic-liability` (owed, loss, negative trends). Clay sidebar + terracotta CTA preserved.

**Remaining dashboard-only:** `dashboardA1Ui.ts` (Heroicon domain maps), `dashboardStructure.ts` (Shows row/list tokens + deprecated re-exports), weekly hero inset/toolbar layout strings.

### Next phase — Index page rollout

### Responsive behavior (one system)

| Viewport     | Sidebar      | Main layout                        | Tables              | KPI strips      |
| ------------ | ------------ | ---------------------------------- | ------------------- | --------------- |
| Wide desktop | Fixed 248px  | `full` tier, optional inner max    | Full width + scroll | 4-col           |
| 1440px       | Fixed        | Same                               | Same                | 4-col           |
| 1080px       | Fixed        | Same; rails should stack (Phase 4) | Horizontal scroll   | 2×2 or lead+row |
| Phone        | Drawer 272px | Stacked                            | Card rows           | Single column   |

---

## Related docs

- [`docs/architecture/workspace-layout.md`](../architecture/workspace-layout.md) — layout primitives (unchanged)
- [`design/colors.md`](../../design/colors.md) — palette reference
- [`frontend/app/(admin)/admin/README.md`](<../../frontend/app/(admin)/admin/README.md>) — workspace overview
