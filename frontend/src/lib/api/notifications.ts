import { backendGetJson, backendMutateJson } from './backend';

export type NotificationSeverity = 'info' | 'success' | 'warning';

/** Persisted workspace notification row for the bell Recent updates section. */
export interface WorkspaceNotification {
  id: string;
  notification_type: string;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  href: string;
  source_type: string | null;
  source_id: string | null;
  occurred_at: string;
  read: boolean;
  /**
   * Auth actor id at emit time (Cognito sub / dev-bypass subject text).
   * Not `users.id` — do not use for avatar lookup in V1.
   */
  actor_user_id: string | null;
}

export interface NotificationsListResponse {
  items: WorkspaceNotification[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface NotificationsUnreadCountResponse {
  count: number;
}

export interface NotificationsMarkAllResponse {
  marked_count: number;
}

export type FetchNotificationsParams = {
  page?: number;
  limit?: number;
  unread_only?: boolean;
  since?: string;
};

/** V1 bell dropdown: first page only, default limit 20. */
export const NOTIFICATIONS_BELL_LIST_LIMIT = 20;

export function buildNotificationsQuery(
  params?: FetchNotificationsParams,
): string {
  const search = new URLSearchParams();
  if (params?.page != null) {
    search.set('page', String(params.page));
  }
  if (params?.limit != null) {
    search.set('limit', String(params.limit));
  }
  if (params?.unread_only) {
    search.set('unread_only', 'true');
  }
  if (params?.since) {
    search.set('since', params.since);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function fetchNotifications(
  params?: FetchNotificationsParams,
): Promise<NotificationsListResponse> {
  return backendGetJson<NotificationsListResponse>(
    `/notifications${buildNotificationsQuery(params)}`,
  );
}

export async function fetchNotificationsUnreadCount(): Promise<number> {
  const res = await backendGetJson<NotificationsUnreadCountResponse>(
    '/notifications/unread-count',
  );
  return res.count;
}

export async function markNotificationRead(
  id: string,
): Promise<WorkspaceNotification> {
  const updated = await backendMutateJson<WorkspaceNotification>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
  if (!updated) {
    throw new Error(`markNotificationRead: empty response for ${id}`);
  }
  return updated;
}

export async function markAllNotificationsRead(
  before?: string,
): Promise<number> {
  const body = before ? { before } : {};
  const res = await backendMutateJson<NotificationsMarkAllResponse>(
    '/notifications/read-all',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return res?.marked_count ?? 0;
}
