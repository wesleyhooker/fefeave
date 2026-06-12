import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import { roundToCents } from "@/lib/showProfit";
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { workspaceTableRowInteractive } from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKFLOW_SHOWS_ARCHIVE_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

export type ShowsClosedAnalytics = {
  closedCount: number;
  totalPayout: number;
  avgProfit: number;
  bestShow: { name: string; profit: number } | null;
  worstShow: { name: string; profit: number } | null;
};

function SummaryChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ArchiveStat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-stone-600">{label}</span>
      <span className="font-semibold tabular-nums text-stone-900">
        {children}
      </span>
    </div>
  );
}

export function ShowsAllTimeClosedSummary({
  analytics,
  variant = "default",
}: {
  analytics: ShowsClosedAnalytics;
  /** Sidebar: compact collapsed archive card. */
  variant?: "default" | "compact";
}) {
  if (analytics.closedCount === 0) return null;

  const summaryLabel =
    variant === "compact"
      ? `${analytics.closedCount} closed`
      : "All-time · closed shows";

  const body = (
    <>
      <p className="text-xs leading-snug text-stone-500">
        Rollup across every completed show (not limited to the weeks above).
      </p>
      <div
        className={
          variant === "compact"
            ? "mt-3 space-y-2"
            : "mt-3 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2"
        }
      >
        {variant === "compact" ? (
          <>
            <ArchiveStat label="Closed">{analytics.closedCount}</ArchiveStat>
            <ArchiveStat label="Total payout">
              {formatCurrency(analytics.totalPayout)}
            </ArchiveStat>
            <ArchiveStat label="Avg profit">
              {formatCurrency(roundToCents(analytics.avgProfit))}
            </ArchiveStat>
            {analytics.bestShow ? (
              <ArchiveStat label="Best">
                {formatCurrency(analytics.bestShow.profit)}
              </ArchiveStat>
            ) : null}
            {analytics.worstShow ? (
              <ArchiveStat label="Worst">
                {formatCurrency(analytics.worstShow.profit)}
              </ArchiveStat>
            ) : null}
          </>
        ) : (
          <>
            <span className="text-sm text-gray-600">
              Closed:{" "}
              <strong className="text-gray-900">{analytics.closedCount}</strong>
            </span>
            <span className="text-sm text-gray-600">
              Total payout:{" "}
              <strong className="tabular-nums text-gray-900">
                {formatCurrency(analytics.totalPayout)}
              </strong>
            </span>
            <span className="text-sm text-gray-600">
              Avg profit:{" "}
              <strong className="tabular-nums text-gray-900">
                {formatCurrency(roundToCents(analytics.avgProfit))}
              </strong>
            </span>
            {analytics.bestShow && (
              <span className="text-sm text-gray-600">
                Best:{" "}
                <strong className="tabular-nums text-gray-900">
                  {formatCurrency(analytics.bestShow.profit)}
                </strong>
                <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                  ({analytics.bestShow.name})
                </span>
              </span>
            )}
            {analytics.worstShow && (
              <span className="text-sm text-gray-600">
                Worst:{" "}
                <strong className="tabular-nums text-gray-900">
                  {formatCurrency(analytics.worstShow.profit)}
                </strong>
                <span className="ml-1 max-w-[120px] truncate text-gray-500 sm:max-w-none">
                  ({analytics.worstShow.name})
                </span>
              </span>
            )}
          </>
        )}
      </div>
    </>
  );

  if (variant === "compact") {
    return (
      <WorkspaceCard aria-label={WORKFLOW_SHOWS_ARCHIVE_HEADING}>
        <details className="group min-w-0">
          <summary
            className={`flex cursor-pointer list-none items-center gap-2 border-b border-admin-border/90 bg-admin-mutedStrip/55 px-4 py-3 [&_*]:cursor-inherit ${workspaceTableRowInteractive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-actionPrimary/30 focus-visible:ring-inset group-open:border-transparent [&::-webkit-details-marker]:hidden`}
          >
            <span className="min-w-0 flex-1 text-sm font-semibold text-admin-ink">
              {WORKFLOW_SHOWS_ARCHIVE_HEADING}
            </span>
            <span className="shrink-0 text-xs font-medium text-stone-600">
              {summaryLabel}
            </span>
            <SummaryChevron className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <WorkspaceCardBody>{body}</WorkspaceCardBody>
        </details>
      </WorkspaceCard>
    );
  }

  return (
    <details className="group rounded-lg border border-gray-200 bg-admin-mutedStrip/85 shadow-workspace-surface">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-800 [&_*]:cursor-inherit ${workspaceTableRowInteractive} hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-inset [&::-webkit-details-marker]:hidden`}
      >
        <span>{summaryLabel}</span>
        <SummaryChevron className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-gray-200 px-4 py-3">{body}</div>
    </details>
  );
}
