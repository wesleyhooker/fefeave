import { formatCurrency } from "@/lib/format";

function formatChartAxisValue(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
import type { DashboardDayProfitPoint } from "./dashboardAnalyticsUtils";
import {
  dashboardAnalyticsBody,
  dashboardAnalyticsCard,
  dashboardAnalyticsHeader,
} from "./dashboardStructure";

const VB_H = 36;
const Y_BOTTOM = 34;
const Y_TOP = 8;

function mtdTotal(days: DashboardDayProfitPoint[]): number {
  return days.reduce((s, d) => (d.isAfterToday ? s : s + d.profit), 0);
}

function lineGeometry(days: DashboardDayProfitPoint[]): {
  polylinePoints: string;
  areaPath: string;
  dots: { cx: number; cy: number; key: string }[];
  maxProfit: number;
} {
  const n = days.length;
  if (n === 0) {
    return { polylinePoints: "", areaPath: "", dots: [], maxProfit: 0 };
  }
  const maxProfit = Math.max(
    0,
    ...days.filter((d) => !d.isAfterToday).map((d) => d.profit),
  );
  const span = Y_BOTTOM - Y_TOP;
  const pts: string[] = [];
  const dots: { cx: number; cy: number; key: string }[] = [];

  if (n === 1) {
    const d = days[0]!;
    let y = Y_BOTTOM;
    if (!d.isAfterToday) {
      y = maxProfit <= 0 ? Y_BOTTOM : Y_BOTTOM - (d.profit / maxProfit) * span;
    }
    pts.push(`0,${y}`, `100,${y}`);
    if (!d.isAfterToday && d.profit > 0) {
      dots.push({ cx: 50, cy: y, key: d.dateKey });
    }
  } else {
    for (let i = 0; i < n; i++) {
      const d = days[i]!;
      const x = (i / (n - 1)) * 100;
      let y = Y_BOTTOM;
      if (!d.isAfterToday) {
        y =
          maxProfit <= 0 ? Y_BOTTOM : Y_BOTTOM - (d.profit / maxProfit) * span;
      }
      pts.push(`${x},${y}`);
      if (!d.isAfterToday && d.profit > 0) {
        dots.push({ cx: x, cy: y, key: d.dateKey });
      }
    }
  }

  const polylinePoints = pts.join(" ");
  let areaPath = "";
  if (pts.length >= 2) {
    const firstX = pts[0]?.split(",")[0] ?? "0";
    const lastX = pts[pts.length - 1]?.split(",")[0] ?? "100";
    areaPath = `M ${pts[0]} L ${pts.slice(1).join(" L ")} L ${lastX},${Y_BOTTOM} L ${firstX},${Y_BOTTOM} Z`;
  }

  return { polylinePoints, areaPath, dots, maxProfit };
}

function MonthTrendChart({ days }: { days: DashboardDayProfitPoint[] }) {
  const { polylinePoints, areaPath, dots, maxProfit } = lineGeometry(days);
  const hasLine = polylinePoints.length > 0;
  const axisTop =
    maxProfit > 0 ? formatChartAxisValue(maxProfit) : formatChartAxisValue(0);

  return (
    <div className="flex gap-2 sm:gap-2.5">
      <div
        className="flex w-[2.65rem] shrink-0 flex-col justify-between py-0.5 text-right text-[9px] font-medium leading-none text-stone-400 tabular-nums sm:w-[2.85rem]"
        aria-hidden
      >
        <span title={maxProfit > 0 ? formatCurrency(maxProfit) : undefined}>
          {axisTop}
        </span>
        <span title={formatCurrency(0)}>{formatChartAxisValue(0)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 100 ${VB_H}`}
          className="h-12 w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-hidden
        >
          <line
            x1="0"
            y1={Y_BOTTOM}
            x2="100"
            y2={Y_BOTTOM}
            className="stroke-stone-200/90"
            strokeWidth="0.35"
            vectorEffect="non-scaling-stroke"
          />
          {areaPath ? (
            <path
              d={areaPath}
              className="fill-emerald-600/[0.07]"
              fillRule="evenodd"
            />
          ) : null}
          {hasLine ? (
            <polyline
              points={polylinePoints}
              fill="none"
              className="stroke-emerald-700/45"
              strokeWidth="0.9"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {dots.map(({ cx, cy, key }) => (
            <circle
              key={key}
              cx={cx}
              cy={cy}
              r={1.15}
              className="fill-emerald-700/55"
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between pl-0.5 text-[10px] tabular-nums text-stone-400">
          <span>1</span>
          <span className="hidden sm:inline">
            {days[Math.floor((days.length - 1) / 2)]?.dayOfMonth ?? "—"}
          </span>
          <span>{days[days.length - 1]?.dayOfMonth ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

function TrendBody({
  days,
  monthTitle,
  summaryForAria,
}: {
  days: DashboardDayProfitPoint[];
  monthTitle: string;
  summaryForAria: string;
}) {
  const hasAnyClosedDayProfit = days.some(
    (d) => !d.isAfterToday && d.profit > 0,
  );

  return (
    <>
      <div className="sr-only" role="status">{`Trend: ${summaryForAria}`}</div>
      {!hasAnyClosedDayProfit ? (
        <p className="text-sm text-stone-600">
          No completed-show profit in {monthTitle} yet.
        </p>
      ) : (
        <MonthTrendChart days={days} />
      )}
    </>
  );
}

function TrendSkeleton() {
  return (
    <div className="flex gap-2 sm:gap-2.5" aria-hidden>
      <div className="flex w-[2.65rem] shrink-0 flex-col justify-between py-0.5 sm:w-[2.85rem]">
        <div className="ml-auto h-2 w-8 animate-pulse rounded bg-stone-200/55" />
        <div className="ml-auto h-2 w-5 animate-pulse rounded bg-stone-200/50" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-12 w-full animate-pulse rounded-md bg-stone-200/60" />
        <div className="flex justify-between pl-0.5">
          <div className="h-2 w-4 animate-pulse rounded bg-stone-200/50" />
          <div className="h-2 w-4 animate-pulse rounded bg-stone-200/50" />
        </div>
      </div>
    </div>
  );
}

export function DashboardThisMonthDailyEarningsCard({
  monthTitle,
  days,
  error,
  pending,
}: {
  monthTitle: string;
  days: DashboardDayProfitPoint[] | null;
  error: string | null;
  pending: boolean;
}) {
  const summaryForAria =
    days == null
      ? pending
        ? "Loading this month trend."
        : error != null
          ? "Trend unavailable."
          : "No data."
      : days
          .map((d) => `Day ${d.dayOfMonth} ${formatCurrency(d.profit)}`)
          .join(", ");

  const total = days != null && !pending ? mtdTotal(days) : null;

  return (
    <section
      className={dashboardAnalyticsCard}
      aria-label={`This month estimated profit trend for ${monthTitle}`}
    >
      <div className={dashboardAnalyticsHeader}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-stone-900">
            This month
          </h2>
          {total != null ? (
            <span className="text-xs font-medium tabular-nums text-stone-600">
              MTD {formatCurrency(total)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-stone-500">{monthTitle}</p>
      </div>

      <div className={dashboardAnalyticsBody}>
        {error != null ? (
          <p className="text-sm leading-snug text-rose-800/90">{error}</p>
        ) : pending || days == null ? (
          <TrendSkeleton />
        ) : (
          <TrendBody
            days={days}
            monthTitle={monthTitle}
            summaryForAria={summaryForAria}
          />
        )}
      </div>
    </section>
  );
}
