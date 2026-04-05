"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { workspaceChromeHover } from "./_components/workspaceUi";

const NAV_ITEMS: {
  href: string;
  label: string;
  match: (path: string) => boolean;
}[] = [
  {
    href: "/admin",
    label: "Home",
    match: (p) => p === "/admin" || p === "/admin/dashboard",
  },
  {
    href: "/admin/shows",
    label: "Shows",
    match: (p) => p.startsWith("/admin/shows"),
  },
  {
    href: "/admin/balances",
    label: "Balances",
    match: (p) => p === "/admin/balances" || p.startsWith("/admin/wholesalers"),
  },
  {
    href: "/admin/payments",
    label: "Payments",
    match: (p) => p.startsWith("/admin/payments"),
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
      {NAV_ITEMS.map(({ href, label, match }) => {
        const isActive = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2 text-sm ${
              isActive
                ? "bg-gray-200/45 font-semibold text-gray-900 transition-[color,background-color] duration-200 ease-out"
                : `text-gray-700 ${workspaceChromeHover}`
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
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

  return (
    <>
      {/* Desktop: fixed-width sidebar */}
      <aside
        className="hidden w-56 shrink-0 bg-white p-4 md:block"
        aria-label="Admin navigation"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Admin
        </h2>
        <nav className="flex flex-col gap-1" aria-label="Admin navigation">
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
          <div className="absolute left-0 top-0 z-10 h-full w-64 border-r border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Admin
              </h2>
              <button
                type="button"
                onClick={onMobileClose}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 ${workspaceChromeHover}`}
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
            <nav className="flex flex-col gap-1">
              <NavLinks pathname={pathname ?? ""} onNavigate={onMobileClose} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
