# Reseller workspace header chrome

Admin-only top bar for `/admin/*` (not used on the public marketing site).

| File                        | Role                                                  |
| --------------------------- | ----------------------------------------------------- |
| `WorkspaceHeader.tsx`       | Brand cluster, mobile menu, search slot, page actions |
| `WorkspaceHeaderSlots.tsx`  | Context for pages to register header actions          |
| `WorkspaceHeaderSearch.tsx` | Placeholder search UI (inert until wired)             |

Composed in `AdminLayoutClient.tsx`. Styling tokens live in `../workspaceUi.ts`.

Public site header: `app/_components/headers/PublicHeader.tsx`.
