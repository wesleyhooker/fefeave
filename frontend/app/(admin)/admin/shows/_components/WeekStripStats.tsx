import { formatCurrency, formatCurrencyAbs } from "@/lib/format";
import { workspaceListPrimaryMoneyAmountClass } from "@/app/(admin)/admin/_components/workspaceUi";
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
  const open = shows.filter((s) => (s.status ?? "").toUpperCase() === "ACTIVE");
  let profit = 0;
  for (const s of closed) {
    const sum = summaries[s.id];
    if (sum) profit += sum.estimatedShowProfit;
  }
  profit = roundToCents(profit);

  const metaBits: string[] = [];
  metaBits.push(`${shows.length} ${shows.length === 1 ? "show" : "shows"}`);
  if (open.length > 0) metaBits.push(`${open.length} open`);
  if (closed.length > 0) metaBits.push(`${closed.length} closed`);

  const profitDisplay =
    profit < 0 ? formatCurrencyAbs(profit) : formatCurrency(profit);

  return (
    <p
      className={
        dense
          ? "mt-1 text-[11px] leading-relaxed text-gray-500"
          : "mt-2 text-xs leading-relaxed text-gray-600"
      }
    >
      {metaBits.length > 0 ? metaBits.join(" · ") : null}
      {closed.length > 0 ? (
        <>
          {metaBits.length > 0 ? " · " : null}
          Est. profit{" "}
          <span className={workspaceListPrimaryMoneyAmountClass(profit)}>
            {profitDisplay}
          </span>
        </>
      ) : null}
    </p>
  );
}
