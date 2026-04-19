"use client";

import {
  CalendarDaysIcon,
  HomeIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  workspaceActionIconMd,
  workspaceChromeHoverWarm,
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
            className={`group relative flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-2 text-sm transition-[color,background-color,box-shadow] duration-200 ease-out ${
              isActive
                ? "bg-gradient-to-r from-rose-50/95 to-stone-50/40 font-semibold text-stone-900 shadow-[inset_3px_0_0_0_rgba(225,148,158,0.65),0_1px_2px_rgba(28,25,23,0.04)] ring-1 ring-rose-200/35"
                : `text-stone-600 ${workspaceChromeHoverWarm}`
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-[border-color,background-color,color] duration-200 ${
                isActive
                  ? "border-rose-200/70 bg-white/90 text-rose-700/90"
                  : "border-transparent bg-stone-100/50 text-stone-500 group-hover:border-stone-200/80 group-hover:bg-white/80 group-hover:text-stone-700"
              }`}
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
};

export function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

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
    <div className="mb-5 border-b border-stone-200/70 pb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        Fefe Ave
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-stone-800">
        Workspace
      </p>
      <p className="mt-1 text-xs leading-snug text-stone-500">
        Boutique operations
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed-width sidebar */}
      <aside
        className="hidden w-[15.5rem] shrink-0 border-r border-stone-200/80 bg-gradient-to-b from-[#fdfcfb] via-white to-stone-50/40 p-4 md:block"
        aria-label="Admin navigation"
      >
        {brandBlock}
        <nav className="flex flex-col gap-1.5" aria-label="Admin navigation">
          <NavLinks pathname={pathname ?? ""} />
        </nav>
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
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 z-10 h-full w-[17rem] border-r border-stone-200/80 bg-gradient-to-b from-[#fdfcfb] to-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-800">Menu</p>
              <button
                type="button"
                onClick={onMobileClose}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone-600 ${workspaceChromeHoverWarm}`}
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
            <nav className="flex flex-col gap-1.5">
              <NavLinks pathname={pathname ?? ""} onNavigate={onMobileClose} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
