# Reseller workspace header chrome

Admin-only top bar for `/admin/*` (not used on the public marketing site).

| File                             | Role                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `WorkspaceHeader.tsx`            | Brand cluster, mobile menu, search slot, chrome (bell, settings, profile), page actions |
| `WorkspaceHeaderChrome.tsx`      | Settings gear, profile menu; composes notifications menu                                |
| `WorkspaceNotificationsMenu.tsx` | Bell button + dropdown (Needs attention + Recent updates)                               |
| `WorkspaceHeaderSlots.tsx`       | Context for pages to register header actions                                            |
| `WorkspaceHeaderSearch.tsx`      | Placeholder search UI (inert until wired)                                               |

Composed in `AdminLayoutClient.tsx`. Notification state: `WorkspaceNotificationsContext.tsx`. Styling tokens live in `../workspaceUi.ts`.

See [`docs/architecture/notifications-attention.md`](../../../../docs/architecture/notifications-attention.md).

Public site header: `app/_components/headers/PublicHeader.tsx`.
