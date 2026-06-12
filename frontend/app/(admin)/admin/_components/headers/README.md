# Reseller workspace header chrome

Admin-only top bar for `/admin/*` (not used on the public marketing site).

| File                        | Role                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `WorkspaceHeader.tsx`       | Brand cluster, mobile menu, search slot, chrome (bell, settings, profile), page actions |
| `WorkspaceHeaderChrome.tsx` | Notifications, settings gear, profile menu                                              |
| `WorkspaceHeaderSlots.tsx`  | Context for pages to register header actions                                            |
| `WorkspaceHeaderSearch.tsx` | Placeholder search UI (inert until wired)                                               |

Composed in `AdminLayoutClient.tsx`. Styling tokens live in `../workspaceUi.ts`.

Public site header: `app/_components/headers/PublicHeader.tsx`.
