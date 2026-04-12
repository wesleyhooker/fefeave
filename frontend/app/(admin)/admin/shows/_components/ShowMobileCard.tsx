import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatTimeAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { ShowStatusPill } from "@/app/(admin)/admin/_components/ShowStatusPill";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";

function isToday(dateStr: string): boolean {
  if (!dateStr || dateStr.length < 10) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function cardAriaLabel(show: ShowViewModel): string {
  const st = (show.status ?? "").toUpperCase();
  if (st === "ACTIVE") {
    return `Open ${show.name} to continue close out`;
  }
  if (st === "COMPLETED") {
    return `Review ${show.name}`;
  }
  return `Open ${show.name}`;
}

export function ShowMobileCard({
  show,
  summary,
}: {
  show: ShowViewModel;
  summary: ShowFinancialSummary | undefined;
}) {
  const today = isToday(show.date);
  const href = `/admin/shows/${show.id}`;

  return (
    <Link
      href={href}
      className={`group/card block rounded-lg border border-gray-200 bg-white p-3.5 shadow-workspace-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-gray-300 hover:shadow-md sm:p-4 ${
        today ? "ring-1 ring-sky-300 hover:ring-sky-400/80" : ""
      }`}
      aria-label={cardAriaLabel(show)}
    >
      <ShowStatusPill status={show.status ?? ""} />

      <p className="mt-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover/card:text-gray-700">
        {show.name}
      </p>

      {(summary != null || show.updated_at) && (
        <p className="mt-0.5 text-xs text-gray-500">
          {summary != null && summary.settlementCount >= 0 && (
            <span>
              {summary.settlementCount === 1
                ? "1 settlement"
                : `${summary.settlementCount} settlements`}
            </span>
          )}
          {show.updated_at && (
            <span>
              {summary != null && summary.settlementCount >= 0 ? " · " : ""}
              Updated {formatTimeAgo(show.updated_at)}
            </span>
          )}
        </p>
      )}

      <p className="mt-1.5 text-xs text-gray-600">
        {formatDate(show.date)}
        {today ? (
          <span className="ml-1.5 inline-block rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800">
            Today
          </span>
        ) : null}
      </p>

      {summary != null ? (
        <div className="mt-2.5 border-t border-gray-100 pt-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Est. profit
          </p>
          <p className="mt-0.5 text-sm text-gray-800">
            <span
              className={`text-sm ${workspaceListPrimaryMoneyAmountClass(
                summary.estimatedShowProfit,
              )}`}
            >
              {formatCurrency(summary.estimatedShowProfit)}
            </span>
          </p>
          {summary.totalOwed > 0 ? (
            <p
              className={`mt-0.5 text-xs tabular-nums ${workspaceMoneyClassForLiability(summary.totalOwed)}`}
            >
              Owed {formatCurrency(summary.totalOwed)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-2.5 border-t border-gray-100 pt-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Est. profit
          </p>
          <p
            className={`mt-0.5 text-sm ${workspaceMoneyMuted} ${workspaceMoneyTabular}`}
          >
            —
          </p>
        </div>
      )}

      <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
        <WorkspaceRowChevron className="text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
      </div>
    </Link>
  );
}
