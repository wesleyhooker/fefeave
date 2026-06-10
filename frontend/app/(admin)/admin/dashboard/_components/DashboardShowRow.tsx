import { formatCurrency, formatDate } from "@/lib/format";
import { showNavigateHref } from "@/app/(admin)/admin/_lib/showRoutes";
import type { ShowDTO } from "@/src/lib/api/shows";
import {
  workspaceMoneyClassForSigned,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { DashboardClickableRow } from "./DashboardClickableRow";
import { DashboardRowChevron } from "./DashboardRowChevron";
import { DashboardShowStatusCompact } from "./DashboardShowStatusCompact";

export function DashboardShowRow({
  show,
  summary,
}: {
  show: ShowDTO;
  summary: ShowFinancialSummary | undefined;
}) {
  const isClosed = (show.status ?? "").toUpperCase() === "COMPLETED";
  const excludedLabel = !isClosed ? (
    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
      Excluded
    </span>
  ) : null;
  const href = showNavigateHref(show.id, show.status);
  const label = `${show.name}, ${formatDate(show.show_date)}`;

  const trailing =
    summary == null ? (
      <span
        className={`text-sm ${workspaceMoneyMuted} ${workspaceMoneyTabular}`}
      >
        —
      </span>
    ) : (
      <span
        className={`shrink-0 text-sm font-semibold ${workspaceMoneyTabular} ${workspaceMoneyClassForSigned(summary.estimatedShowProfit)}`}
      >
        {formatCurrency(summary.estimatedShowProfit)}
      </span>
    );

  return (
    <DashboardClickableRow href={href} aria-label={label}>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:hidden">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <DashboardShowStatusCompact status={show.status ?? ""} />
            <span
              className={`min-w-0 truncate text-sm font-semibold leading-snug ${
                isClosed ? "text-stone-900" : "text-stone-500"
              }`}
            >
              {show.name}
            </span>
            {excludedLabel}
          </div>
          <span className="shrink-0 pt-0.5">
            <DashboardRowChevron />
          </span>
        </div>
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <time
            dateTime={show.show_date}
            className="shrink-0 text-xs tabular-nums text-stone-500"
          >
            {formatDate(show.show_date)}
          </time>
          <span className="min-w-0 shrink text-right">{trailing}</span>
        </div>
      </div>
      <span className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
        <DashboardShowStatusCompact status={show.status ?? ""} />
        <span
          className={`min-w-0 truncate text-sm font-medium ${
            isClosed ? "text-stone-900" : "text-stone-500"
          }`}
        >
          {show.name}
        </span>
        {excludedLabel}
      </span>
      <time
        dateTime={show.show_date}
        className="hidden shrink-0 whitespace-nowrap text-xs text-stone-500 tabular-nums sm:block"
      >
        {formatDate(show.show_date)}
      </time>
      <span className="hidden sm:inline">{trailing}</span>
      <span className="hidden shrink-0 sm:block">
        <DashboardRowChevron />
      </span>
    </DashboardClickableRow>
  );
}
