"use client";

import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutForm } from "@/app/_components/auth/LogoutForm";
import {
  FINANCIALS_NAV_CHILDREN,
  FINANCIALS_WORKSPACE_LABEL,
  isFinancialsChildActive,
  isFinancialsSectionActive,
} from "./_lib/adminSidebarNav";
import {
  workspaceActionIconMd,
  workspaceChromeHoverWarm,
  workspaceNavChildItemActive,
  workspaceNavChildItemBase,
  workspaceNavChildItemInactive,
  workspaceNavIconActive,
  workspaceNavIconInactive,
  workspaceNavItemActive,
  workspaceNavItemBase,
  workspaceNavItemInactive,
  workspaceNavSectionTrigger,
  workspaceNavSectionTriggerActive,
  workspaceNavSectionTriggerInactive,
  workspaceSidebarAccountSection,
  workspaceSidebarAccountSignOutCluster,
  workspaceSidebarAvatar,
  workspaceSidebarRolePill,
  workspaceSidebarSignOut,
  workspaceSidebarSurface,
  workspaceSidebarUserDisplayName,
} from "./_components/workspaceUi";

const TOP_NAV_ITEMS: {
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
];

function TopNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {TOP_NAV_ITEMS.map(({ href, label, Icon, match }) => {
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

function FinancialsNavSection({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const path = pathname ?? "";
  const sectionActive = isFinancialsSectionActive(path);
  const [expanded, setExpanded] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) {
      setExpanded(true);
    }
  }, [sectionActive]);

  const Chevron = expanded ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className={`${workspaceNavSectionTrigger} ${
          sectionActive
            ? workspaceNavSectionTriggerActive
            : workspaceNavSectionTriggerInactive
        }`}
        aria-expanded={expanded}
        aria-controls="admin-nav-financials-children"
      >
        <span
          className={
            sectionActive ? workspaceNavIconActive : workspaceNavIconInactive
          }
          aria-hidden
        >
          <ScaleIcon className={workspaceActionIconMd} />
        </span>
        <span className="min-w-0 flex-1 leading-snug">
          {FINANCIALS_WORKSPACE_LABEL}
        </span>
        <Chevron className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      </button>
      {expanded ? (
        <div
          id="admin-nav-financials-children"
          className="flex flex-col gap-0.5"
          role="group"
          aria-label={`${FINANCIALS_WORKSPACE_LABEL} pages`}
        >
          {FINANCIALS_NAV_CHILDREN.map((item) => {
            const isActive = isFinancialsChildActive(item, path);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={`${workspaceNavChildItemBase} ${
                  isActive
                    ? workspaceNavChildItemActive
                    : workspaceNavChildItemInactive
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <TopNavLinks pathname={pathname} onNavigate={onNavigate} />
      <FinancialsNavSection pathname={pathname} onNavigate={onNavigate} />
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
        <LogoutForm
          buttonClassName={workspaceSidebarSignOut}
          onSubmit={() => onNavigate?.()}
        >
          <ArrowRightOnRectangleIcon
            className={workspaceActionIconMd}
            aria-hidden
          />
          <span>Sign out</span>
        </LogoutForm>
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
