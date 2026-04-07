"use client";

import Link from "next/link";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import {
  dashboardCtaAddShow,
  dashboardPageIntroAccent,
  dashboardPageIntroStrip,
} from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";

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
    <header className={dashboardPageIntroStrip}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className={`min-w-0 ${dashboardPageIntroAccent}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Hey {name}{" "}
            <span className="font-normal" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm font-medium tabular-nums text-stone-600">
            {weekRangeLabel}
          </p>
        </div>
        <Link
          href="/admin/shows/new"
          className={`${dashboardCtaAddShow} w-full justify-center sm:w-auto sm:shrink-0`}
        >
          <span className="text-base font-semibold leading-none" aria-hidden>
            +
          </span>
          Show
        </Link>
      </div>
    </header>
  );
}
