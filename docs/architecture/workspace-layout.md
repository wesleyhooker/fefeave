# Reseller workspace layout architecture

Operator pages under `/admin/*` share one layout system: a **left-anchored page frame** (tier max-width inside the main canvas), a **12-column grid**, and **composable card shells**. Visual tokens stay in `workspaceUi.ts`; structure lives in the files below.

## Source of truth

| Concern                                          | Location                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Container tiers + frame classes                  | `frontend/app/(admin)/admin/_lib/workspacePageContentWidth.ts`      |
| Route → page content tier (reference)            | `frontend/app/(admin)/admin/_lib/workspaceContainerTierForPath.ts`  |
| Grid row + span class tokens                     | `frontend/app/(admin)/admin/_lib/workspaceLayoutGrid.ts`            |
| Grid components                                  | `frontend/app/(admin)/admin/_components/WorkspaceGrid.tsx`          |
| Card composition                                 | `frontend/app/(admin)/admin/_components/WorkspaceCard.tsx`          |
| Page shell (intro + container)                   | `AdminWorkspacePageLayout.tsx`, `AdminPageContainer.tsx`            |
| Global header inner frame                        | `headers/WorkspaceHeader.tsx` → `workspaceHeaderCanvasFrameClass()` |
| Entity-specific grids (show detail, right panel) | `workspacePageRegions.ts`                                           |
| Dashboard module chrome (`rounded-2xl`)          | `dashboard/_components/dashboardStructure.ts`                       |

## Shell structure

```text
┌─────────────┬──────────────────────────────────────────┐
│  Sidebar    │  Workspace canvas (flex-1 main column)   │
│  248px      │  ┌────────────────────────────────────┐  │
│  fixed      │  │ Header band (full-bleed background) │  │
│             │  │  └─ canvas gutters only (no max-w)  │  │
│             │  ├────────────────────────────────────┤  │
│             │  │ Page intro (full-bleed background)  │  │
│             │  │  └─ left-anchored frame (page tier) │  │
│             │  ├────────────────────────────────────┤  │
│             │  │ Page content                        │  │
│             │  │  └─ left-anchored frame (page tier) │  │
│             │  │      └─ WorkspaceGrid / cards     │  │
│             │  └────────────────────────────────────┘  │
└─────────────┴──────────────────────────────────────────┘
```

- **Sidebar:** `w-[15.5rem]` (248px), `md+` fixed; mobile drawer `17rem`.
- **Page frame:** `w-full` + tier `max-w-*` + `px-4 md:px-6` gutters via `workspaceContainerFrameClass(tier)` — left-aligned in the canvas (no `mx-auto`).
- **No** `calc(100vw - …)` or viewport-subtraction sizing on the page frame.

## Container tiers

Applied via `containerTier` on `AdminWorkspacePageLayout`, `AdminPageContainer`, and `AdminPageIntroSection`.

| Tier       | Max width | Approx.      | Routes (default)                                                           |
| ---------- | --------- | ------------ | -------------------------------------------------------------------------- |
| `compact`  | `45rem`   | 720px        | Settings, record payment, financial prefs                                  |
| `standard` | `75rem`   | 1200px       | Default fallback                                                           |
| `wide`     | `90rem`   | 1440px       | Owner, log show, batch pay                                                 |
| `full`     | (none)    | canvas width | Shows, Vendors, Purchases, Dashboard, Ledger, entity detail — no fixed cap |

### Header vs page

`WorkspaceHeader` uses **`workspaceHeaderCanvasFrameClass()`** — shell gutters (`px-4 md:px-6`) and `w-full` across the main column, with **no** `max-w-*`. Search, notifications, settings, and profile sit in that full canvas (actions cluster `ml-auto` on the right). Page intro and content use **`workspaceContainerFrameClass(tier)`** — same left gutter as the header; tier `max-w-*` caps width without centering.

There is **no** global right rail in the shell; page-level grids (e.g. Shows 9/3, Ledger aside) own right-side support columns.

## Grid system

### `WorkspaceGrid`

- `variant="stack"` — vertical sections (full-width children inside the container). Use for stacked rows on index pages.
- `variant="twelve"` — `lg:grid-cols-12`. Children use `WorkspaceGridItem` spans. Below `lg`, every item is full width.
- `variant="ledger-aside"` — main column + **320px** fixed aside (Ledger health).

### `WorkspaceGridItem` spans (`lg+`)

| Prop             | Columns | Typical use                                |
| ---------------- | ------- | ------------------------------------------ |
| `full`           | 12      | Tables, activity bands, form cards         |
| `half`           | 6       | Two-up sections                            |
| `primary`        | 8       | Command primary column                     |
| `secondary`      | 4       | Side modules / rails                       |
| `splitPrimary`   | 5       | Vendor detail — money / controls           |
| `splitSecondary` | 7       | Vendor detail — ledger                     |
| `sidebar`        | 3       | Narrow column (e.g. Shows support rail)    |
| `main`           | 9       | Wide column (e.g. Shows operational queue) |

For `ledger-aside`, use `column="main"` | `column="aside"` instead of span.

### Page recipes (container + grid)

| Page                     | Container | Grid composition                                          |
| ------------------------ | --------- | --------------------------------------------------------- |
| **Dashboard**            | `full`    | `stack` → `twelve` 8/4 + 8/4 → `twelve` `full` (activity) |
| **Shows**                | `full`    | `stack` → `twelve` 9/3 rows (open / this week / past)     |
| **Vendors**              | `full`    | `stack` `full`: obligation strip → segments → table       |
| **Purchases**            | `full`    | `stack`: metric strip → toolbar → tabs → activity         |
| **Owner**                | `wide`    | `stack` `full`: stats → tabs → payout                     |
| **Ledger**               | `full`    | `stack` `full` stats → `ledger-aside`                     |
| **Settings**             | `compact` | `stack` `full`: nav link cards                            |
| **Record payment**       | `compact` | `stack` `full`: single form card                          |
| **Show / vendor detail** | `full`    | Entity grids (`workspacePageShowDetailGrid`, vendor 5/7)  |
| **Log show / batch pay** | `wide`    | Form workflows                                            |

## Card system

Use **`WorkspaceCard`** + composition — not ad-hoc `workspaceCard` on `<section>` for new work.

| Piece                 | Role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `WorkspaceCard`       | `surface`: `card` (default), `panel`, `dashboard` (hub modules only) |
| `WorkspaceCardHeader` | Title, subtitle, `actions`, or `toolbar` layout                      |
| `WorkspaceCardBody`   | `padding` default true; false for tables/lists                       |
| `WorkspaceCardFooter` | Border-top footer band                                               |

## Mobile

- Page frames grow to `w-full` within gutters up to the tier `max-w-*` cap.
- All `twelve` spans collapse to a single column below `lg`.

## Deprecated

| Old                                   | Replacement                                       |
| ------------------------------------- | ------------------------------------------------- |
| `widthMode` prop                      | `containerTier`                                   |
| `dashboard` / `extraWide` modes       | `wide` / `full`                                   |
| `contentWidthClassName` override      | `containerTier="full"` (etc.)                     |
| `workspaceMainContentInset` dual path | `workspaceContainerFrameClass`                    |
| `calc(100vw - …)` caps                | Fixed `max-w-[Nrem]` tiers                        |
| Header tied to page container tier    | `workspaceHeaderCanvasFrameClass()` (canvas only) |

Legacy aliases (`workspacePageContentWidthExtraWide`, etc.) remain in `workspaceUi.ts` as thin re-exports until call sites finish migrating.

## Related product doc

[`docs/product/reseller-workspace-v2.md`](../product/reseller-workspace-v2.md) — navigation and workflow IA (orthogonal to layout primitives).
