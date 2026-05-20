"use client";

import type { ReactNode } from "react";

import {
  workspaceDashboardStatIconCompleted,
  workspaceDashboardStatIconNegative,
  workspaceDashboardStatIconNeutral,
  workspaceDashboardStatIconOwed,
  workspaceDashboardStatIconPositive,
  workspaceDashboardStatIconProfit,
} from "@/app/(admin)/admin/_components/workspaceUi";

function SvgBase({ children }: { children: ReactNode }) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        {children}
      </svg>
    </>
  );
}

/** YTD profit / default KPI — `$` glyph on peach chip. */
export function WorkspaceSummaryStatProfitIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconProfit} ${className ?? ""}`}
      aria-hidden
    >
      $
    </span>
  );
}

/** Vendors owed icon — grouped users motif. */
export function WorkspaceSummaryStatOwedIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconOwed} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </SvgBase>
    </span>
  );
}

/** Completed milestones — simple check motif. */
export function WorkspaceSummaryStatCompletedIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconCompleted} ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M5 10.5l3 3 6.5-6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Outstanding balance — muted alert motif on rose chip. */
export function WorkspaceSummaryStatOutstandingIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconNegative} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </SvgBase>
    </span>
  );
}

/** Total owed (balances) — same grouped-users motif as dashboard “vendors”. */
export function WorkspaceSummaryStatTotalsOwedIcon({
  className,
}: {
  className?: string;
}) {
  return <WorkspaceSummaryStatOwedIcon className={className} />;
}

/** Paid totals — confirmation check circle. */
export function WorkspaceSummaryStatPaidIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconPositive} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </SvgBase>
    </span>
  );
}

/** Vendor / row counts — users motif on warm paper chip. */
export function WorkspaceSummaryStatVendorCountIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconNeutral} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </SvgBase>
    </span>
  );
}

/** Last payout / scheduling context. */
export function WorkspaceSummaryStatCalendarIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconNeutral} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
        />
      </SvgBase>
    </span>
  );
}

/** Payout count — stack motif. */
export function WorkspaceSummaryStatPayoutStackIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={`${workspaceDashboardStatIconNeutral} ${className ?? ""}`}
      aria-hidden
    >
      <SvgBase>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 6h12M6 10h12m-12 8h12M6 14h12"
        />
      </SvgBase>
    </span>
  );
}
