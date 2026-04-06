"use client";

import Link from "next/link";
import { workspacePageMeta } from "@/app/(admin)/admin/_components/workspaceUi";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";

const dashboardAddShowCta =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/35 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40";

function greetingNameFromEmail(email: string | null): string {
  if (email == null || !email.includes("@")) return "there";
  const local = email.split("@")[0]?.replace(/[.+_]/g, " ").trim() ?? "";
  const first = local.split(/\s+/)[0] ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function DashboardPageHeader({
  weekRangeLabel,
}: {
  weekRangeLabel: string;
}) {
  const { email } = useAdminWorkspace();
  const name = greetingNameFromEmail(email);

  return (
    <header className="border-b border-gray-100 pb-5">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Hey {name}{" "}
              <span className="font-normal" aria-hidden>
                👋
              </span>
            </h1>
            <p className={`mt-1 ${workspacePageMeta} text-gray-600`}>
              {weekRangeLabel}
            </p>
          </div>
          <Link href="/admin/shows/new" className={dashboardAddShowCta}>
            <span
              className="text-base font-semibold leading-none text-emerald-700"
              aria-hidden
            >
              +
            </span>
            Show
          </Link>
        </div>
      </div>
    </header>
  );
}
