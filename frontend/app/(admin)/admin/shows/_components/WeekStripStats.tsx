import { formatCurrency, formatCurrencyAbs } from "@/lib/format";
import { workspaceListPrimaryMoneyAmountClass } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  workspaceThisWeekSupportingMeta,
  workspaceThisWeekTitleToStatsGap,
} from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import { roundToCents } from "@/lib/showProfit";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import type { ShowViewModel } from "@/src/lib/api/shows";

export function WeekStripStats({
  shows,
  summaries,
  dense = false,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  dense?: boolean;
}) {
  const closed = shows.filter(
    (s) => (s.status ?? "").toUpperCase() === "COMPLETED",
  );
  const upcoming = Math.max(0, shows.length - closed.length);
  let profit = 0;
  let hasProfitData = false;
  for (const s of closed) {
    const sum = summaries[s.id];
    if (sum) {
      profit += sum.estimatedShowProfit;
      hasProfitData = true;
    }
  }
  profit = roundToCents(profit);

  const metaBits: string[] = [];
  metaBits.push(`${shows.length} ${shows.length === 1 ? "show" : "shows"}`);
  if (closed.length > 0) metaBits.push(`${closed.length} closed`);
  if (upcoming > 0) metaBits.push(`${upcoming} upcoming`);

  const profitDisplay =
    profit < 0 ? formatCurrencyAbs(profit) : formatCurrency(profit);

  return (
    <p
      className={
        dense
          ? "mt-1.5 text-xs font-medium leading-relaxed text-stone-500 sm:mt-1 sm:text-[11px]"
          : `${workspaceThisWeekTitleToStatsGap} text-xs leading-relaxed ${workspaceThisWeekSupportingMeta}`
      }
    >
      {metaBits.length > 0 ? metaBits.join(" · ") : null}
      {hasProfitData ? (
        <>
          {metaBits.length > 0 ? " · " : null}
          <span className={workspaceListPrimaryMoneyAmountClass(profit)}>
            {profitDisplay}
          </span>
        </>
      ) : null}
    </p>
  );
}
