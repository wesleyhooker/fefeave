"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WORKSPACE_INVALIDATE_EVENT } from "@/lib/workspaceInvalidate";
import {
  fetchNotifications,
  fetchNotificationsUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_BELL_LIST_LIMIT,
  type WorkspaceNotification,
} from "@/src/lib/api/notifications";

type WorkspaceNotificationsContextValue = {
  unreadCount: number;
  items: WorkspaceNotification[];
  unreadLoading: boolean;
  listLoading: boolean;
  unreadError: string | null;
  listError: string | null;
  refresh: () => Promise<void>;
  refreshList: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (before?: string) => Promise<void>;
};

const WorkspaceNotificationsContext =
  createContext<WorkspaceNotificationsContextValue>({
    unreadCount: 0,
    items: [],
    unreadLoading: false,
    listLoading: false,
    unreadError: null,
    listError: null,
    refresh: async () => {},
    refreshList: async () => {},
    markRead: async () => {},
    markAllRead: async () => {},
  });

function toErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

function capUnreadCount(count: number): number {
  return Math.max(0, Math.min(99, count));
}

/**
 * Refreshes notification unread count and cached first-page list for the bell.
 * Mounted once in the admin shell — not tied to a single page lifecycle.
 */
function WorkspaceNotificationsSync({
  refresh,
}: {
  refresh: () => Promise<void>;
}) {
  const isFetchingRef = useRef(false);

  const runRefresh = useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    void refresh().finally(() => {
      isFetchingRef.current = false;
    });
  }, [refresh]);

  useEffect(() => {
    runRefresh();

    const onInvalidate = () => runRefresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") runRefresh();
    };

    window.addEventListener(WORKSPACE_INVALIDATE_EVENT, onInvalidate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener(WORKSPACE_INVALIDATE_EVENT, onInvalidate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runRefresh]);

  return null;
}

export function WorkspaceNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<WorkspaceNotification[]>([]);
  const [unreadLoading, setUnreadLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [unreadError, setUnreadError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const lastSyncedAtRef = useRef<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    setUnreadLoading(true);
    try {
      const count = await fetchNotificationsUnreadCount();
      setUnreadCount(capUnreadCount(count));
      setUnreadError(null);
    } catch (err) {
      setUnreadError(toErrorMessage(err));
    } finally {
      setUnreadLoading(false);
    }
  }, []);

  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      const since = lastSyncedAtRef.current ?? undefined;
      const result = await fetchNotifications({
        page: 1,
        limit: NOTIFICATIONS_BELL_LIST_LIMIT,
        since,
      });

      if (since && result.items.length > 0) {
        setItems((prev) => {
          const seen = new Set(result.items.map((item) => item.id));
          const merged = [
            ...result.items,
            ...prev.filter((item) => !seen.has(item.id)),
          ];
          return merged.slice(0, NOTIFICATIONS_BELL_LIST_LIMIT);
        });
      } else if (!since || result.items.length > 0) {
        setItems(result.items);
      }

      lastSyncedAtRef.current = new Date().toISOString();
      setListError(null);
    } catch (err) {
      setListError(toErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refreshUnreadCount(), refreshList()]);
  }, [refreshList, refreshUnreadCount]);

  const markRead = useCallback(
    async (id: string) => {
      const wasUnread = items.find((item) => item.id === id)?.read === false;
      const updated = await markNotificationRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (wasUnread) {
        setUnreadCount((prev) => capUnreadCount(prev - 1));
      }
    },
    [items],
  );

  const markAllRead = useCallback(
    async (before?: string) => {
      await markAllNotificationsRead(before);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      unreadCount,
      items,
      unreadLoading,
      listLoading,
      unreadError,
      listError,
      refresh,
      refreshList,
      markRead,
      markAllRead,
    }),
    [
      unreadCount,
      items,
      unreadLoading,
      listLoading,
      unreadError,
      listError,
      refresh,
      refreshList,
      markRead,
      markAllRead,
    ],
  );

  return (
    <WorkspaceNotificationsContext.Provider value={value}>
      <WorkspaceNotificationsSync refresh={refresh} />
      {children}
    </WorkspaceNotificationsContext.Provider>
  );
}

export function useWorkspaceNotifications(): WorkspaceNotificationsContextValue {
  return useContext(WorkspaceNotificationsContext);
}
