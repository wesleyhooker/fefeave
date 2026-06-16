# Reseller workspace UI (`/admin/*`)

Operator / reseller workspace under `/admin/*` (URLs and route group stay `admin`). Styling is **not** `@/system` (public marketing); use the **A1 Warm Clay** design system.

**Design system:** [`docs/design/a1-workspace-design-system.md`](../../../../docs/design/a1-workspace-design-system.md)  
**Primitives (import for new code):** `@/app/(admin)/admin/_components/workspace`  
**Composed tokens:** `workspaceUi.ts` + `workspaceDesignTokens.ts`

## Public vs admin (do not mix)

| Surface            | UI system                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Public marketing   | `@/system`, `app/(public)/_components/shell/publicShell.ts`, `publicCtaClasses.ts`, `--fefe-*` |
| Reseller workspace | `workspaceUi.ts`, `admin/_components/*`, `--admin-*`                                           |
| Cross-route shared | Neutral only — e.g. `LogoutForm`, `lib/format`, auth helpers                                   |

Admin-only chrome (top bar) lives in `_components/headers/`. Public chrome lives in `app/_components/headers/PublicHeader.tsx`.

## Page structure (three layers)

1. **Global chrome** — `AdminLayoutClient` → `AdminSidebar` (Dashboard, Shows, Vendors, Purchases, Owner) + `WorkspaceHeader` (search, notifications, settings, profile)
2. **Page intro** — `AdminWorkspacePageLayout` or `AdminPageIntroSection` + `AdminPageIntro` / `AdminWorkspacePageIntro`
3. **Work surface** — `AdminPageContainer` children (cards, tables, forms)

## Reseller dashboard polish

Hub modules use shared tokens (`WORKSPACE_HUB_CARD_SHELL` in `workspaceDesignTokens.ts`) via `WorkspaceCard surface="hub"`. `dashboard/_components/dashboardStructure.ts` is a **deprecated alias layer** for backward compatibility; new code should import from `workspaceDesignTokens` and `_components/workspace`.

## Layout primitives

Every reseller page should compose **`AdminWorkspacePageLayout`** + **`WorkspaceGrid`** / **`WorkspaceGridItem`** + **`WorkspaceCard`** (when a bordered section is needed). See [`docs/architecture/workspace-layout.md`](../../../../docs/architecture/workspace-layout.md).

| Component                  | When to use                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| `AdminWorkspacePageLayout` | Intro band + content column; set `containerTier`                      |
| `WorkspaceGrid`            | `stack`, `twelve`, or `ledger-aside` page grids                       |
| `WorkspaceGridItem`        | Column span (`full`, `primary`, `secondary`, …)                       |
| `WorkspaceCard`            | Form, table, or module shell (`surface`: `card` \| `panel` \| `hub`)  |
| `AdminWorkspacePageIntro`  | List page titles (no wave, no accent rail)                            |
| `AdminEntityBreadcrumb`    | Entity-detail or compact parent/current trails                        |
| `WorkspaceEmptyState`      | List/table/week empty copy                                            |
| `WorkspaceInlineError`     | Failed fetch with retry                                               |
| `workspace/index.ts`       | **A1 primitives** — Button, KpiTile, MetricStrip, Status, Table, etc. |
| `workspaceUi.ts`           | Composed visual tokens (actions, money, table chrome)                 |
| `workspaceDesignTokens.ts` | Documented A1 token constants (typography, spacing, focus)            |

## Adding a page

1. `AdminWorkspacePageLayout` with the correct `containerTier` and intro.
2. `WorkspaceGrid` for the work surface (see layout doc for span recipes).
3. `WorkspaceCard` for bordered sections; keep dashboard hub modules on `surface="dashboard"` when needed.
4. Reuse `workspaceAction*` for buttons; do not duplicate primary/secondary Tailwind.
5. `AdminEntityBreadcrumb` for entity-detail intros; `WorkspaceEmptyState` for empty lists.

See `docs/architecture/workspace-layout.md` and the header comment in `workspaceUi.ts`.
