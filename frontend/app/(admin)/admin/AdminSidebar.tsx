"use client";

import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  HomeIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  workspaceActionIconMd,
  workspaceChromeHoverWarm,
  workspaceNavIconActive,
  workspaceNavIconInactive,
  workspaceNavItemActive,
  workspaceNavItemBase,
  workspaceNavItemInactive,
  workspaceSidebarAccountSection,
  workspaceSidebarAccountSignOutCluster,
  workspaceSidebarAvatar,
  workspaceSidebarRolePill,
  workspaceSidebarSignOut,
  workspaceSidebarSurface,
  workspaceSidebarUserDisplayName,
} from "./_components/workspaceUi";

const NAV_ITEMS: {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
  match: (path: string) => boolean;
}[] = [
  {
    href: "/admin",
    label: "Home",
    Icon: HomeIcon,
    match: (p) => p === "/admin" || p === "/admin/dashboard",
  },
  {
    href: "/admin/shows",
    label: "Shows",
    Icon: CalendarDaysIcon,
    match: (p) => p.startsWith("/admin/shows"),
  },
  {
    href: "/admin/balances",
    label: "Balances",
    Icon: ScaleIcon,
    match: (p) =>
      p === "/admin/balances" ||
      p.startsWith("/admin/balances/") ||
      p.startsWith("/admin/wholesalers") ||
      p.startsWith("/admin/payments"),
  },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, Icon, match }) => {
        const isActive = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`${workspaceNavItemBase} ${
              isActive ? workspaceNavItemActive : workspaceNavItemInactive
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={
                isActive ? workspaceNavIconActive : workspaceNavIconInactive
              }
              aria-hidden
            >
              <Icon className={workspaceActionIconMd} />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{label}</span>
          </Link>
        );
      })}
    </>
  );
}

export type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
};

function sidebarAvatarInitial(email: string | null): string {
  const s = email?.trim();
  if (!s) return "?";
  const alnum = s.match(/[a-zA-Z0-9]/);
  return (alnum?.[0] ?? s[0]).toUpperCase();
}

function SidebarAccountBlock({
  email,
  roles,
  onNavigate,
}: {
  email: string | null;
  roles: string[];
  onNavigate?: () => void;
}) {
  const displayLine = email?.trim() || "Signed in";

  return (
    <div className={workspaceSidebarAccountSection}>
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={workspaceSidebarAvatar} aria-hidden>
          {sidebarAvatarInitial(email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className={workspaceSidebarUserDisplayName}>{displayLine}</p>
          {roles.length > 0 ? (
            <div
              className="mt-1.5 flex flex-wrap gap-1"
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
      </div>

      <div className={workspaceSidebarAccountSignOutCluster}>
        <Link
          href="/api/auth/logout"
          onClick={onNavigate}
          className={workspaceSidebarSignOut}
        >
          <ArrowRightOnRectangleIcon
            className={workspaceActionIconMd}
            aria-hidden
          />
          <span>Sign out</span>
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
  email,
  roles,
  envLabel: _envLabel,
  isProduction: _isProduction,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileEntered, setMobileEntered] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setMobileEntered(true));
    return () => cancelAnimationFrame(id);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !onMobileClose) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, onMobileClose]);

  const brandBlock = (
    <div className="mb-5 border-b border-admin-sidebarDivider/35 pb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-sidebarText">
        Fefe Ave
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-admin-sidebarText">
        Workspace
      </p>
      <p className="mt-1 text-xs leading-snug text-admin-sidebarTextMuted">
        Boutique operations
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed-width sidebar */}
      <aside
        className={`hidden w-[15.5rem] shrink-0 flex-col p-4 md:flex ${workspaceSidebarSurface}`}
        data-debug-admin-sidebar
        aria-label="Admin navigation"
      >
        {brandBlock}
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1.5"
          aria-label="Admin navigation"
        >
          <NavLinks pathname={pathname ?? ""} />
        </nav>
        <SidebarAccountBlock email={email} roles={roles} />
      </aside>

      {/* Mobile: overlay drawer when open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Admin menu"
        >
          <button
            type="button"
            onClick={onMobileClose}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              mobileEntered ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close menu"
          />
          <div
            className={`absolute left-0 top-0 z-10 flex h-full w-[17rem] flex-col p-4 shadow-xl transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${workspaceSidebarSurface} ${
              mobileEntered
                ? "translate-x-0 opacity-100"
                : "-translate-x-3 opacity-0"
            }`}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <p className="text-sm font-semibold text-admin-sidebarText">
                Menu
              </p>
              <button
                type="button"
                onClick={onMobileClose}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-admin-sidebarTextMuted ${workspaceChromeHoverWarm}`}
                aria-label="Close menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {brandBlock}
            <nav className="flex min-h-0 flex-1 flex-col gap-1.5">
              <NavLinks pathname={pathname ?? ""} onNavigate={onMobileClose} />
            </nav>
            <SidebarAccountBlock
              email={email}
              roles={roles}
              onNavigate={onMobileClose}
            />
          </div>
        </div>
      )}
    </>
  );
}
