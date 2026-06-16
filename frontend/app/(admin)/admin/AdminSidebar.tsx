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
import { WORKFLOW_SIDEBAR_RESELLER_WORKSPACE } from "./_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceChromeHoverWarm,
  workspaceNavIconActive,
  workspaceNavIconInactive,
  workspaceNavItemActive,
  workspaceNavItemBase,
  workspaceNavItemInactive,
  workspaceNavItemLabel,
  workspaceSidebarBrandBlock,
  workspaceSidebarBrandTitle,
  workspaceSidebarBrandWordmark,
  workspaceSidebarContentColumn,
  workspaceSidebarMobilePanel,
  workspaceSidebarNavList,
  workspaceSidebarPanel,
  workspaceSidebarPanelPadding,
  workspaceSidebarWidth,
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
            <span className={workspaceNavItemLabel}>{item.label}</span>
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
    <div className={workspaceSidebarBrandBlock}>
      <p className={workspaceSidebarBrandWordmark}>fefe ave</p>
      <p className={workspaceSidebarBrandTitle}>
        {WORKFLOW_SIDEBAR_RESELLER_WORKSPACE}
      </p>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden ${workspaceSidebarWidth} md:flex ${workspaceSidebarPanel} ${workspaceSidebarPanelPadding}`}
        aria-label="Admin navigation"
      >
        <div className={workspaceSidebarContentColumn}>
          {brandBlock}
          <nav
            className={workspaceSidebarNavList}
            aria-label="Admin navigation"
          >
            <NavLinks pathname={pathname ?? ""} />
          </nav>
        </div>
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
            className={`absolute left-0 top-0 z-10 ${workspaceSidebarWidth} ${workspaceSidebarMobilePanel} ${workspaceSidebarPanelPadding} transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
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
            <div className={`${workspaceSidebarContentColumn} flex-1`}>
              {brandBlock}
              <nav className={workspaceSidebarNavList}>
                <NavLinks
                  pathname={pathname ?? ""}
                  onNavigate={onMobileClose}
                />
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
