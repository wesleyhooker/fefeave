"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  {
    href: "/admin/inventory",
    label: "Inventory",
    match: (p) => p.startsWith("/admin/inventory"),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Admin
      </h2>
      <nav className="flex flex-col gap-1" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ href, label, match }) => {
          const isActive = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-gray-200 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
