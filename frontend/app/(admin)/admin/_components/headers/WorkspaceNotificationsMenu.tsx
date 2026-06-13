"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import {
  attentionItemsForDropdown,
  type AttentionItem,
} from "@/app/(admin)/admin/_lib/workspaceAttentionItems";
import { useWorkspaceAttention } from "../WorkspaceAttentionContext";
import { useWorkspaceNotifications } from "../WorkspaceNotificationsContext";
import {
  workspaceActionIconMd,
  workspaceChromeHover,
  workspaceShowsTableStatusDotOpen,
} from "../workspaceUi";
import type { WorkspaceNotification } from "@/src/lib/api/notifications";

const MENU_ID = "workspace-notifications-menu";
const TRIGGER_ID = "workspace-notifications-menu-trigger";

function attentionItemHref(item: AttentionItem): string {
  if (item.kind === "navigate") return item.href;
  if (item.source === "shows") return "/admin/shows";
  if (item.source === "vendors") return "/admin/vendors";
  return "/admin/dashboard";
}

function attentionItemDescription(item: AttentionItem): string | undefined {
  if (item.kind === "error") return item.description;
  if (item.count != null && item.count > 0) {
    return `${item.count} need attention`;
  }
  if (item.amount != null && item.amount > 0) {
    return formatCurrency(item.amount);
  }
  return item.description;
}

function buildBellAriaLabel(
  unreadCount: number,
  hasAttention: boolean,
): string {
  const parts = ["Notifications"];
  if (unreadCount > 0) {
    parts.push(`${unreadCount} unread`);
  }
  if (hasAttention) {
    parts.push("items need attention");
  }
  return parts.join(", ");
}

function NotificationSeverityDot({
  severity,
}: {
  severity: WorkspaceNotification["severity"];
}) {
  const colorClass =
    severity === "warning"
      ? "bg-amber-500/85"
      : severity === "success"
        ? "bg-emerald-600/70"
        : "bg-sky-500/80";
  return (
    <span
      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colorClass}`}
      aria-hidden
    />
  );
}

export function WorkspaceNotificationsMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { count: attentionCount, items: attentionItems } =
    useWorkspaceAttention();
  const {
    unreadCount,
    items: notifications,
    listLoading,
    listError,
    unreadError,
    refreshList,
    markRead,
    markAllRead,
  } = useWorkspaceNotifications();

  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const attentionRows = useMemo(
    () => attentionItemsForDropdown(attentionItems),
    [attentionItems],
  );
  const hasAttention = attentionCount > 0;
  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;
  const showAllCaughtUp =
    !listLoading && !hasAttention && !hasNotifications && !listError;

  const closeMenu = useCallback(() => setOpen(false), []);

  const toggleMenu = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        void refreshList();
      }
      return next;
    });
  }, [refreshList]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [closeMenu]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeMenu]);

  const handleAttentionClick = useCallback(
    (item: AttentionItem) => {
      closeMenu();
      router.push(attentionItemHref(item));
    },
    [closeMenu, router],
  );

  const handleNotificationClick = useCallback(
    async (notification: WorkspaceNotification) => {
      try {
        if (!notification.read) {
          await markRead(notification.id);
        }
      } catch {
        // Header must stay usable if mark-read fails.
      }
      closeMenu();
      router.push(notification.href);
    },
    [closeMenu, markRead, router],
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
    } catch {
      // Non-fatal — list may refresh on next open.
    } finally {
      setMarkingAll(false);
    }
  }, [markAllRead]);

  const numericBadge =
    unreadCount > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-semibold leading-none text-white"
        aria-hidden
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    ) : null;

  const attentionDot =
    !hasUnread && hasAttention ? (
      <span
        className={`absolute right-1 top-1 ${workspaceShowsTableStatusDotOpen}`}
        aria-hidden
      />
    ) : null;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        id={TRIGGER_ID}
        onClick={toggleMenu}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-admin-inkMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 ${workspaceChromeHover}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? MENU_ID : undefined}
        aria-label={buildBellAriaLabel(unreadCount, hasAttention)}
      >
        <BellIcon className={workspaceActionIconMd} aria-hidden />
        {numericBadge}
        {attentionDot}
      </button>

      {open ? (
        <div
          id={MENU_ID}
          role="menu"
          aria-labelledby={TRIGGER_ID}
          className="absolute right-0 top-full z-50 mt-1.5 flex max-h-[min(28rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-lg max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-[4.25rem] max-sm:mt-0 max-sm:w-auto sm:w-[min(22rem,calc(100vw-2rem))] sm:max-w-[calc(100vw-2rem)]"
        >
          <div className="overflow-y-auto py-2">
            {showAllCaughtUp ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">
                All caught up
              </p>
            ) : null}

            {attentionRows.length > 0 ? (
              <section className="px-2 pb-2">
                <h3 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Needs attention
                </h3>
                <ul className="space-y-0.5">
                  {attentionRows.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleAttentionClick(item)}
                        className="flex w-full flex-col rounded-md px-2 py-2 text-left transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-admin-actionPrimary/45"
                      >
                        <span className="text-sm font-medium text-stone-900">
                          {item.label}
                        </span>
                        {attentionItemDescription(item) ? (
                          <span className="mt-0.5 text-xs text-stone-600">
                            {attentionItemDescription(item)}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border-t border-stone-100 px-2 pt-2">
              <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Recent updates
                </h3>
                {hasUnread ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    disabled={markingAll}
                    className="shrink-0 text-[11px] font-medium text-admin-actionPrimary hover:underline disabled:opacity-50"
                  >
                    {markingAll ? "Marking…" : "Mark all read"}
                  </button>
                ) : null}
              </div>

              {listError || unreadError ? (
                <p className="px-2 py-2 text-xs text-amber-800">
                  Could not load updates. Try again shortly.
                </p>
              ) : null}

              {listLoading && !hasNotifications ? (
                <p className="px-2 py-3 text-sm text-stone-500">Loading…</p>
              ) : null}

              {!listLoading && !hasNotifications && !listError ? (
                <p className="px-2 py-3 text-sm text-stone-500">
                  No recent updates
                </p>
              ) : null}

              {hasNotifications ? (
                <ul className="space-y-0.5">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          void handleNotificationClick(notification)
                        }
                        className={`flex w-full gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-admin-actionPrimary/45 ${
                          notification.read ? "opacity-80" : ""
                        }`}
                      >
                        <NotificationSeverityDot
                          severity={notification.severity}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${
                              notification.read
                                ? "font-normal text-stone-700"
                                : "font-semibold text-stone-900"
                            }`}
                          >
                            {notification.title}
                          </span>
                          {notification.body ? (
                            <span className="mt-0.5 block truncate text-xs text-stone-600">
                              {notification.body}
                            </span>
                          ) : null}
                          <span className="mt-0.5 block text-[11px] text-stone-500">
                            {formatTimeAgo(notification.occurred_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <div className="border-t border-stone-100 px-3 py-2">
            <Link
              href="/admin/ledger"
              role="menuitem"
              onClick={closeMenu}
              className="block rounded-md px-1 py-1.5 text-sm font-medium text-admin-actionPrimary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45"
            >
              View ledger
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
