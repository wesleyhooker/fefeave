# Reseller workspace UI (`/admin/*`)

Operator / reseller workspace under `/admin/*` (URLs and route group stay `admin`). Styling is **not** `@/system` (public marketing); use `workspaceUi.ts` and components under this tree.

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

`/admin/dashboard` may use slightly richer module surfaces via `dashboard/_components/dashboardStructure.ts` (`rounded-2xl`, warm stone shadows). That is intentional — the dashboard is the hub — and is **not** required on every `workspaceCard` page.

## Layout primitives

Every reseller page should compose **`AdminWorkspacePageLayout`** + **`WorkspaceGrid`** / **`WorkspaceGridItem`** + **`WorkspaceCard`** (when a bordered section is needed). See [`docs/architecture/workspace-layout.md`](../../../../docs/architecture/workspace-layout.md).

| Component                  | When to use                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `AdminWorkspacePageLayout` | Intro band + content column; set `containerTier`                           |
| `WorkspaceGrid`            | `stack`, `twelve`, or `ledger-aside` page grids                            |
| `WorkspaceGridItem`        | Column span (`full`, `primary`, `secondary`, …)                            |
| `WorkspaceCard`            | Form, table, or module shell (`surface`: `card` \| `panel` \| `dashboard`) |
| `AdminWorkspacePageIntro`  | List page titles (no wave, no accent rail)                                 |
| `AdminEntityBreadcrumb`    | Entity-detail or compact parent/current trails                             |
| `WorkspaceEmptyState`      | List/table/week empty copy                                                 |
| `WorkspaceInlineError`     | Failed fetch with retry                                                    |
| `workspaceUi.ts`           | Visual tokens (actions, money, table chrome)                               |

## Adding a page

1. `AdminWorkspacePageLayout` with the correct `containerTier` and intro.
2. `WorkspaceGrid` for the work surface (see layout doc for span recipes).
3. `WorkspaceCard` for bordered sections; keep dashboard hub modules on `surface="dashboard"` when needed.
4. Reuse `workspaceAction*` for buttons; do not duplicate primary/secondary Tailwind.
5. `AdminEntityBreadcrumb` for entity-detail intros; `WorkspaceEmptyState` for empty lists.

See `docs/architecture/workspace-layout.md` and the header comment in `workspaceUi.ts`.
