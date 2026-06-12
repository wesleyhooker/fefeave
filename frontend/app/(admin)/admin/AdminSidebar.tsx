"use client";

import {
  BanknotesIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PRIMARY_NAV_ITEMS,
  isPrimaryNavItemActive,
} from "./_lib/adminSidebarNav";
import {
  workspaceActionIconMd,
  workspaceChromeHoverWarm,
  workspaceNavIconActive,
  workspaceNavIconInactive,
  workspaceNavItemActive,
  workspaceNavItemBase,
  workspaceNavItemInactive,
  workspaceSidebarSurface,
} from "./_components/workspaceUi";

const NAV_ICONS = {
  Dashboard: Squares2X2Icon,
  Shows: CalendarDaysIcon,
  Vendors: TruckIcon,
  Purchases: BanknotesIcon,
  "Business Health": UserCircleIcon,
} as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const path = pathname ?? "";

  return (
    <>
      {PRIMARY_NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.label as keyof typeof NAV_ICONS];
        const isActive = isPrimaryNavItemActive(item, path);
        return (
          <Link
            key={item.href}
            href={item.href}
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
            <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export type AdminSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  envLabel: string;
  isProduction: boolean;
};

export function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
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
      <aside
        className={`hidden w-[15.5rem] shrink-0 flex-col p-4 md:flex ${workspaceSidebarSurface}`}
        aria-label="Admin navigation"
      >
        {brandBlock}
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1.5"
          aria-label="Admin navigation"
        >
          <NavLinks pathname={pathname ?? ""} />
        </nav>
      </aside>

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
          </div>
        </div>
      )}
    </>
  );
}
