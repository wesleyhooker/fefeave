"use client";

import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutForm } from "@/app/_components/auth/LogoutForm";
import { useWorkspaceAttention } from "../WorkspaceAttentionContext";
import { DASHBOARD_HREF, SETTINGS_HREF } from "../../_lib/adminSidebarNav";
import {
  workspaceActionIconMd,
  workspaceChromeHover,
  workspaceSidebarAvatar,
  workspaceSidebarRolePill,
  workspaceSidebarSignOut,
} from "../workspaceUi";

function headerAvatarInitial(email: string | null): string {
  const s = email?.trim();
  if (!s) return "?";
  const alnum = s.match(/[a-zA-Z0-9]/);
  return (alnum?.[0] ?? s[0]).toUpperCase();
}

function ChromeIconButton({
  href,
  label,
  children,
  badgeCount,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badgeCount?: number;
}) {
  const badge =
    badgeCount != null && badgeCount > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-semibold leading-none text-white"
        aria-hidden
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </span>
    ) : null;

  return (
    <Link
      href={href}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-admin-inkMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 ${workspaceChromeHover}`}
      aria-label={
        badgeCount != null && badgeCount > 0
          ? `${label}, ${badgeCount} items need attention`
          : label
      }
    >
      {children}
      {badge}
    </Link>
  );
}

function WorkspaceProfileMenu({
  email,
  roles,
}: {
  email: string | null;
  roles: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayLine = email?.trim() || "Signed in";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        id="workspace-profile-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 ${workspaceChromeHover}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? "workspace-profile-menu" : undefined}
        aria-label="Account menu"
      >
        <span
          className={`${workspaceSidebarAvatar} h-8 w-8 text-xs`}
          aria-hidden
        >
          {headerAvatarInitial(email)}
        </span>
      </button>
      {open ? (
        <div
          id="workspace-profile-menu"
          role="menu"
          aria-labelledby="workspace-profile-menu-trigger"
          className="absolute right-0 top-full z-50 mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-stone-200/90 bg-white py-2 shadow-lg"
        >
          <div className="border-b border-stone-100 px-3 pb-2.5 pt-1">
            <p className="truncate text-sm font-medium text-stone-900">
              {displayLine}
            </p>
            {roles.length > 0 ? (
              <div
                className="mt-2 flex flex-wrap gap-1"
                aria-label="Your roles"
              >
                {roles.map((role) => (
                  <span key={role} className={workspaceSidebarRolePill}>
                    {role}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="px-2 pt-1">
            <LogoutForm
              buttonClassName={`${workspaceSidebarSignOut} w-full justify-start rounded-md px-2 py-2 text-sm`}
              onSubmit={() => setOpen(false)}
            >
              <ArrowRightOnRectangleIcon
                className={workspaceActionIconMd}
                aria-hidden
              />
              <span>Sign out</span>
            </LogoutForm>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceHeaderChrome({
  email,
  roles,
}: {
  email: string | null;
  roles: string[];
}) {
  const { count: attentionCount } = useWorkspaceAttention();

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 sm:gap-1"
      aria-label="Workspace tools"
    >
      <ChromeIconButton
        href={`${DASHBOARD_HREF}#attention`}
        label="Notifications"
        badgeCount={attentionCount > 0 ? attentionCount : undefined}
      >
        <BellIcon className={workspaceActionIconMd} aria-hidden />
      </ChromeIconButton>
      <ChromeIconButton href={SETTINGS_HREF} label="Settings">
        <Cog6ToothIcon className={workspaceActionIconMd} aria-hidden />
      </ChromeIconButton>
      <WorkspaceProfileMenu email={email} roles={roles} />
    </div>
  );
}
