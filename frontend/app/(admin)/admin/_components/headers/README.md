# Reseller workspace header chrome

Admin-only top bar for `/admin/*` (not used on the public marketing site).

| File                             | Role                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `WorkspacePageHeader.tsx`        | **A1 page-aware header** — title + subtitle + utilities (search, bell, settings, profile) |
| `WorkspacePageHeaderContext.tsx` | Hides legacy global bar when a page registers page-level header                           |
| `WorkspaceHeaderUtilities.tsx`   | Shared search + chrome cluster                                                            |
| `WorkspaceHeader.tsx`            | Legacy global bar (Fefe Ave • Workspace) — unmigrated pages only                          |
| `WorkspaceHeaderChrome.tsx`      | Settings gear, profile menu; composes notifications menu                                  |
| `WorkspaceNotificationsMenu.tsx` | Bell button + dropdown (Needs attention + Recent updates)                                 |
| `WorkspaceHeaderSlots.tsx`       | Context for pages to register header actions / custom search                              |
| `WorkspaceHeaderSearch.tsx`      | Placeholder search UI (inert until wired)                                                 |

**Migration:** Top-level pages pass `pageHeader` to `AdminWorkspacePageLayout` (see `WORKSPACE_TOP_LEVEL_PAGE_HEADERS` or `useDashboardPageHeaderProps`). Loading shells use `TopLevelPageSkeletonShell`. Detail/settings pages keep `intro` + `AdminPageIntro` until migrated.

Composed in `AdminLayoutClient.tsx`. Notification state: `WorkspaceNotificationsContext.tsx`. Styling tokens: `../workspaceUi.ts` (`workspacePageHeader*`).

See [`docs/architecture/notifications-attention.md`](../../../../docs/architecture/notifications-attention.md).

Public site header: `app/_components/headers/PublicHeader.tsx`.
