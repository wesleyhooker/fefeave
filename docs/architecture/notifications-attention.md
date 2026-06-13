# Notifications and Attention (V1)

**Status:** Implemented (Notifications V1)  
**Audience:** Frontend and backend implementers  
**Scope:** Reseller workspace bell (`/admin/*` header chrome)

---

## Three layers

| Layer             | Question                             | Persistence                                               | Bell UI                                       |
| ----------------- | ------------------------------------ | --------------------------------------------------------- | --------------------------------------------- |
| **Attention**     | What needs my attention right now?   | Derived client-side (not stored)                          | Dropdown section **Needs attention**          |
| **Notifications** | What happened since I was last here? | `workspace_notifications` + per-user `notification_reads` | Dropdown section **Recent updates**           |
| **Ledger**        | What happened to the money?          | `financial_events` (audit trail)                          | Footer link **View ledger** → `/admin/ledger` |

Attention is a current-state action queue: not dismissible, disappears when underlying state resolves.  
Notifications are read/unread business updates with stable copy at write time.  
The ledger is not a notification system — do not derive balances or badge counts from notifications.

---

## Bell dropdown (V1)

**Trigger:** Button in `WorkspaceNotificationsMenu` (not a route link).

**Sections:**

1. **Needs attention** — from `buildWorkspaceAttentionItems()` via `WorkspaceAttentionSync`; actionable rows only (`countsTowardBell`).
2. **Recent updates** — from `GET /notifications` via `WorkspaceNotificationsProvider` (page 1, limit 20).
3. **Footer** — View ledger.

**Badge:**

- Numeric amber badge = **unread notification count only** (9+ cap).
- When unread is 0 but attention items exist: subtle amber **dot** on the bell (no number).
- Attention count never inflates the numeric badge.

**Refresh (no interval polling):** shell mount, tab visible, `fefeave:workspace-invalidate`, and opening the dropdown (`refreshList`).

---

## Backend (reference)

- Routes: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- Creation: `notification-rules.ts` + hooks in `financial-event-emission.ts` and show close
- Flag: `NOTIFICATIONS_WRITE_ENABLED` (default on)

See backend migration `1780070000000_workspace_notifications.js` and integration tests `notifications-*-integration`.

---

## Frontend (reference)

| Concern        | Location                                |
| -------------- | --------------------------------------- |
| API client     | `frontend/src/lib/api/notifications.ts` |
| Provider       | `WorkspaceNotificationsContext.tsx`     |
| Bell UI        | `WorkspaceNotificationsMenu.tsx`        |
| Attention sync | `WorkspaceAttentionSync.tsx`            |
| Invalidation   | `frontend/lib/workspaceInvalidate.ts`   |

**Out of scope for V1:** full notifications history page, cursor pagination, notification preferences UI, retention cron.
