"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import { fetchShows, type ShowDTO } from "@/src/lib/api/shows";
import {
  fetchShowFinancialSummary,
  type ShowFinancialSummary,
} from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  formatWeekRangeCompact,
  getCurrentWeekBounds,
  isDateInWeek,
} from "@/lib/weekRange";
import {
  clearSelfPay,
  loadSelfPay,
  saveSelfPay,
  type SelfPayStored,
} from "./selfPayStorage";
import { DASHBOARD_THIS_WEEK_SHOWS_LIMIT } from "./constants";
import {
  workspacePagePrimarySecondaryGrid,
  workspacePageSupportingStack,
  workspacePageTopStack,
} from "../_lib/workspacePageRegions";
import {
  buildCalendarMonthDailySeries,
  type DashboardDayProfitPoint,
} from "./_components/dashboardAnalyticsUtils";
import { DashboardThisMonthDailyEarningsCard } from "./_components/DashboardThisMonthDailyEarningsCard";
import { DashboardNotificationsCard } from "./_components/DashboardNotificationsCard";
import { DashboardOverviewStats } from "./_components/DashboardOverviewStats";
import { DashboardPageHeader } from "./_components/DashboardPageHeader";
import { DashboardThisWeekCard } from "./_components/DashboardThisWeekCard";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "../_components/AdminPageContainer";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminDashboardPage() {
  const weekBounds = useMemo(() => getCurrentWeekBounds(), []);

  const [balances, setBalances] = useState<
    BackendWholesalerBalanceRow[] | null
  >(null);
  const [shows, setShows] = useState<ShowDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [weekProfit, setWeekProfit] = useState<number | null>(null);
  const [weekProfitError, setWeekProfitError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const effectRunIdRef = useRef(0);

  const [selfPay, setSelfPay] = useState<SelfPayStored | null>(null);
  const [weekPreviewSummaries, setWeekPreviewSummaries] = useState<
    Record<string, ShowFinancialSummary>
  >({});
  const [ytdProfit, setYtdProfit] = useState<number | null>(null);
  const [ytdProfitError, setYtdProfitError] = useState<string | null>(null);
  const [monthDailyProfits, setMonthDailyProfits] = useState<
    DashboardDayProfitPoint[] | null
  >(null);
  const [monthDailyError, setMonthDailyError] = useState<string | null>(null);

  const snapshotYear = useMemo(() => new Date().getFullYear(), []);

  /** Single calendar anchor for “this month” analytics (stable for the session). */
  const dashboardCalendar = useMemo(() => {
    const t = new Date();
    return {
      ref: t,
      monthKey: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`,
      monthTitle: t.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  }, []);

  useEffect(() => {
    setSelfPay(loadSelfPay(weekBounds.startStr));
  }, [weekBounds.startStr]);

  useEffect(() => {
    const list = [...(shows ?? [])]
      .filter((s) =>
        isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr),
      )
      .sort(
        (a, b) =>
          new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
      )
      .slice(0, DASHBOARD_THIS_WEEK_SHOWS_LIMIT);

    if (list.length === 0) {
      setWeekPreviewSummaries({});
      return;
    }

    let cancelled = false;
    Promise.all(
      list.map(async (show) => {
        const summary = await fetchShowFinancialSummary(show.id);
        return [show.id, summary] as const;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, ShowFinancialSummary> = {};
      for (const [id, summary] of pairs) {
        next[id] = summary;
      }
      setWeekPreviewSummaries(next);
    });

    return () => {
      cancelled = true;
    };
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  useEffect(() => {
    const list = (shows ?? []).filter((s) => {
      if ((s.status ?? "").toUpperCase() !== "COMPLETED") return false;
      return s.show_date?.slice(0, 4) === String(snapshotYear);
    });
    let cancelled = false;
    if (list.length === 0) {
      setYtdProfit(0);
      setYtdProfitError(null);
      return () => {
        cancelled = true;
      };
    }
    setYtdProfit(null);
    setYtdProfitError(null);
    Promise.all(
      list.map(async (show) => {
        const s = await fetchShowFinancialSummary(show.id);
        return s.estimatedShowProfit;
      }),
    )
      .then((profits) => {
        if (!cancelled) {
          setYtdProfit(profits.reduce((a, b) => a + b, 0));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setYtdProfitError(
            e instanceof Error ? e.message : "Could not load YTD profit.",
          );
          setYtdProfit(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shows, snapshotYear]);

  useEffect(() => {
    const runId = ++effectRunIdRef.current;
    let cancelled = false;
    setLoading(true);
    setBalancesError(null);
    setShowsError(null);
    setWeekProfitError(null);
    setWeekProfit(null);

    Promise.allSettled([fetchWholesalerBalances(), fetchShows()]).then(
      async ([balancesResult, showsResult]) => {
        const isLatestRun = effectRunIdRef.current === runId;
        if (!isLatestRun) return;

        if (!cancelled) {
          if (balancesResult.status === "fulfilled") {
            setBalances(balancesResult.value);
          } else {
            setBalancesError(
              balancesResult.reason instanceof Error
                ? balancesResult.reason.message
                : String(balancesResult.reason),
            );
            setBalances([]);
          }

          if (showsResult.status === "fulfilled") {
            setShows(showsResult.value);
          } else {
            setShowsError(
              showsResult.reason instanceof Error
                ? showsResult.reason.message
                : String(showsResult.reason),
            );
            setShows([]);
          }
        }

        const showList =
          showsResult.status === "fulfilled" ? showsResult.value : [];

        const closedThisWeek = showList.filter((s) => {
          const st = (s.status ?? "").toUpperCase();
          return (
            st === "COMPLETED" &&
            isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr)
          );
        });

        if (closedThisWeek.length === 0) {
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfit(0);
            setLoading(false);
          }
          return;
        }

        try {
          const profits = await Promise.all(
            closedThisWeek.map(async (show) => {
              const s = await fetchShowFinancialSummary(show.id);
              return s.estimatedShowProfit;
            }),
          );
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfit(profits.reduce((a, b) => a + b, 0));
          }
        } catch (e) {
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfitError(
              e instanceof Error ? e.message : "Could not load week profit.",
            );
            setWeekProfit(null);
          }
        } finally {
          if (!cancelled && effectRunIdRef.current === runId) {
            setLoading(false);
          }
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [reloadToken, weekBounds.startStr, weekBounds.endStr]);

  const openShowsCount = useMemo(() => {
    return (shows ?? []).filter(
      (s) => (s.status ?? "").toUpperCase() === "ACTIVE",
    ).length;
  }, [shows]);

  const vendorsOwingCount = useMemo(() => {
    const rows = balances ?? [];
    return rows.filter((row) => parseAmount(row.balance_owed) > 0).length;
  }, [balances]);

  const { showsThisWeek, showsThisWeekTotal } = useMemo(() => {
    const inWeek = (shows ?? []).filter((s) =>
      isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr),
    );
    const sorted = [...inWeek].sort(
      (a, b) =>
        new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
    );
    return {
      showsThisWeek: sorted.slice(0, DASHBOARD_THIS_WEEK_SHOWS_LIMIT),
      showsThisWeekTotal: sorted.length,
    };
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  const closedThisWeekCount = useMemo(() => {
    return (shows ?? []).filter((s) => {
      const st = (s.status ?? "").toUpperCase();
      return (
        st === "COMPLETED" &&
        isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr)
      );
    }).length;
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

  const upcomingThisWeekCount = Math.max(
    0,
    showsThisWeekTotal - closedThisWeekCount,
  );

  const completedShowsYtdCount = useMemo(() => {
    return (shows ?? []).filter((s) => {
      if ((s.status ?? "").toUpperCase() !== "COMPLETED") return false;
      return s.show_date?.slice(0, 4) === String(snapshotYear);
    }).length;
  }, [shows, snapshotYear]);

  const completedShowsThisMonth = useMemo(() => {
    return (shows ?? []).filter((s) => {
      if ((s.status ?? "").toUpperCase() !== "COMPLETED") return false;
      const d = s.show_date;
      return (
        d != null &&
        d.length >= 7 &&
        d.slice(0, 7) === dashboardCalendar.monthKey
      );
    });
  }, [shows, dashboardCalendar.monthKey]);

  useEffect(() => {
    const list = completedShowsThisMonth;
    let cancelled = false;

    if (list.length === 0) {
      setMonthDailyProfits(
        buildCalendarMonthDailySeries(new Map(), dashboardCalendar.ref),
      );
      setMonthDailyError(null);
      return () => {
        cancelled = true;
      };
    }

    setMonthDailyProfits(null);
    setMonthDailyError(null);
    Promise.all(
      list.map(async (show) => {
        const s = await fetchShowFinancialSummary(show.id);
        return { show_date: show.show_date, profit: s.estimatedShowProfit };
      }),
    )
      .then((rows) => {
        if (!cancelled) {
          const byDay = new Map<string, number>();
          for (const row of rows) {
            const ymd = row.show_date;
            if (ymd == null) continue;
            const dayKey = ymd.slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
            byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + row.profit);
          }
          setMonthDailyProfits(
            buildCalendarMonthDailySeries(byDay, dashboardCalendar.ref),
          );
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setMonthDailyError(
            e instanceof Error
              ? e.message
              : "Could not load monthly day totals.",
          );
          setMonthDailyProfits(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completedShowsThisMonth, dashboardCalendar]);

  const totalVendorBalance = useMemo(() => {
    if (balances === null) return null;
    return balances.reduce((sum, r) => sum + parseAmount(r.balance_owed), 0);
  }, [balances]);

  const handleMarkSelfPayDone = () => {
    const profit = weekProfit ?? 0;
    const next: SelfPayStored = {
      paid: true,
      paidAt: new Date().toISOString(),
      profitSnapshot: profit,
    };
    saveSelfPay(weekBounds.startStr, next);
    setSelfPay(next);
  };

  const handleMarkSelfPayUndone = () => {
    clearSelfPay(weekBounds.startStr);
    setSelfPay({ paid: false });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const selfPaid = selfPay?.paid === true;
  const weekProfitDisplay =
    weekProfitError != null ? null : weekProfit !== null ? weekProfit : null;

  const ytdProfitPending =
    completedShowsYtdCount > 0 && ytdProfit === null && ytdProfitError == null;

  const monthDailyPending =
    completedShowsThisMonth.length > 0 &&
    monthDailyProfits === null &&
    monthDailyError == null;

  return (
    <>
      <AdminPageIntroSection>
        <DashboardPageHeader
          weekRangeLabel={formatWeekRangeCompact(weekBounds)}
        />
      </AdminPageIntroSection>

      <AdminPageContainer>
        <div className={workspacePageTopStack}>
          <DashboardOverviewStats
            ytdProfit={ytdProfit}
            ytdProfitError={ytdProfitError}
            ytdProfitPending={ytdProfitPending}
            balancesError={balancesError}
            totalVendorBalance={totalVendorBalance}
            showsError={showsError}
            completedShowsYtdCount={completedShowsYtdCount}
          />
        </div>

        <div className={workspacePagePrimarySecondaryGrid}>
          <div className="min-w-0">
            <DashboardThisWeekCard
              selfPaid={selfPaid}
              selfPay={selfPay}
              onMarkDone={handleMarkSelfPayDone}
              onMarkUndone={handleMarkSelfPayUndone}
              weekProfitError={weekProfitError}
              weekProfitDisplay={weekProfitDisplay}
              closedThisWeekCount={closedThisWeekCount}
              upcomingThisWeekCount={upcomingThisWeekCount}
              showsError={showsError}
              onRetryShows={() => setReloadToken((v) => v + 1)}
              showsThisWeek={showsThisWeek}
              weekPreviewSummaries={weekPreviewSummaries}
              showsThisWeekTotal={showsThisWeekTotal}
              showsLimit={DASHBOARD_THIS_WEEK_SHOWS_LIMIT}
            />
          </div>
          <div className="min-w-0">
            <DashboardNotificationsCard
              showsError={showsError}
              balancesError={balancesError}
              onRetry={() => setReloadToken((v) => v + 1)}
              openShowsCount={openShowsCount}
              vendorsOwingCount={vendorsOwingCount}
            />
          </div>
        </div>

        <div className={workspacePageSupportingStack}>
          <DashboardThisMonthDailyEarningsCard
            monthTitle={dashboardCalendar.monthTitle}
            days={monthDailyProfits}
            error={monthDailyError}
            pending={monthDailyPending}
          />
        </div>
      </AdminPageContainer>
    </>
  );
}
