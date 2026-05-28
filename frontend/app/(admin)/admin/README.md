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

1. **Global chrome** — `AdminLayoutClient` → `AdminSidebar` + `WorkspaceHeader`
2. **Page intro** — `AdminWorkspacePageLayout` or `AdminPageIntroSection` + `AdminPageIntro` / `AdminWorkspacePageIntro`
3. **Work surface** — `AdminPageContainer` children (cards, tables, forms)

## Reseller dashboard polish

`/admin/dashboard` may use slightly richer module surfaces via `dashboard/_components/dashboardStructure.ts` (`rounded-2xl`, warm stone shadows). That is intentional — the dashboard is the hub — and is **not** required on every `workspaceCard` page.

## Shared components

| Component                  | When to use                                                |
| -------------------------- | ---------------------------------------------------------- |
| `AdminWorkspacePageLayout` | Standard index/form pages: intro band + content column     |
| `AdminWorkspacePageIntro`  | List page titles (no wave, no accent rail)                 |
| `AdminEntityBreadcrumb`    | Entity-detail or compact parent/current trails             |
| `WorkspaceEmptyState`      | List/table/week empty copy (`dashed`, `inset`, `plain`, …) |
| `WorkspaceInlineError`     | Failed fetch with retry                                    |
| `workspaceUi.ts`           | Class tokens for actions, cards, tables, money             |

## Adding a page

1. Prefer `AdminWorkspacePageLayout` with `intro={<AdminWorkspacePageIntro … />}` (or `AdminPageIntro` for entity detail).
2. Reuse `workspaceAction*` for buttons; do not duplicate primary/secondary Tailwind.
3. Use `AdminEntityBreadcrumb` for parent/current navigation in intros.
4. Use `WorkspaceEmptyState` for empty lists/tables.

See `docs/architecture.md` and the header comment in `workspaceUi.ts`.
