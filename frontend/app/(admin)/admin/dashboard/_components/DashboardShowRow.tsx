import { formatCurrency, formatDate } from "@/lib/format";
import type { ShowDTO } from "@/src/lib/api/shows";
import {
  workspaceMoneyClassForSigned,
  workspaceMoneyMuted,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { WeekPreviewSummary } from "../types";
import { DashboardClickableRow } from "./DashboardClickableRow";
import { DashboardRowChevron } from "./DashboardRowChevron";
import { DashboardShowStatusCompact } from "./DashboardShowStatusCompact";

export function DashboardShowRow({
  show,
  summary,
}: {
  show: ShowDTO;
  summary: WeekPreviewSummary | undefined;
}) {
  const href = `/admin/shows/${show.id}`;
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
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <DashboardShowStatusCompact status={show.status ?? ""} />
        <span className="min-w-0 truncate text-sm font-medium text-gray-900">
          {show.name}
        </span>
      </span>
      <time
        dateTime={show.show_date}
        className="shrink-0 whitespace-nowrap text-[11px] text-gray-500 tabular-nums sm:text-xs"
      >
        {formatDate(show.show_date)}
      </time>
      {trailing}
      <DashboardRowChevron />
    </DashboardClickableRow>
  );
}
