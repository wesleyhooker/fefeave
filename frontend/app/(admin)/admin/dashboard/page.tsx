"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardContentSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  fetchWholesalerBalanceSnapshots,
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import {
  fetchCompletedShowProfit,
  fetchShows,
  type ShowDTO,
} from "@/src/lib/api/shows";
import { fetchCompletedShowProfitTotal } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  getComparablePriorMonthBounds,
  getMonthToDateBounds,
} from "@/lib/monthRange";
import {
  formatWeekRangeCompact,
  getCurrentWeekBounds,
  isDateInWeek,
} from "@/lib/weekRange";
import { formatCurrency } from "@/lib/format";
import {
  fetchBusinessExpenses,
  fetchBusinessExpensesTotal,
  type BusinessExpenseDTO,
} from "@/src/lib/api/business-expenses";
import {
  fetchInventoryInvested,
  fetchInventoryPurchases,
  type InventoryPurchaseDTO,
} from "@/src/lib/api/inventory-purchases";
import { getOwnerSelfPayWeeklyPayout } from "@/src/lib/api/ownerSelfPay";
import { getPeriodAllocations } from "@/src/lib/api/strategyAllocations";
import { WorkspaceGrid, WorkspaceGridItem } from "../_components/WorkspaceGrid";
import { useDashboardPageHeaderProps } from "./_components/DashboardPageHeader";
import { DashboardWeekHero } from "./_components/DashboardWeekHero";
import { DashboardWorkspaceOverview } from "./_components/DashboardWorkspaceOverview";
import { DashboardTrendStrip } from "./_components/DashboardTrendStrip";
import { AdminWorkspacePageLayout } from "../_components/AdminWorkspacePageLayout";
import {
  buildDashboardHeroSummary,
  countActiveShows,
  countCompletedShowsThisWeek,
  sumVendorBalanceTotal,
} from "./_lib/dashboardSummary";
import {
  buildDashboardWorkspaceCards,
  computeBusinessHealthRemaining,
} from "./_lib/dashboardWorkspaceCards";
import {
  buildDashboardTrendStrip,
  countCompletedShowsInRange,
} from "./_lib/dashboardTrendStrip";

const PURCHASES_LOOKBACK_DAYS = 30;

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminDashboardPage() {
  const pageHeader = useDashboardPageHeaderProps();
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
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [inventoryTotal, setInventoryTotal] = useState<number | null>(null);
  const [expensesTotal, setExpensesTotal] = useState<number | null>(null);
  const [inventoryPurchases, setInventoryPurchases] = useState<
    InventoryPurchaseDTO[]
  >([]);
  const [businessExpenses, setBusinessExpenses] = useState<
    BusinessExpenseDTO[]
  >([]);
  const [purchasesError, setPurchasesError] = useState(false);
  const [businessHealthError, setBusinessHealthError] = useState(false);
  const [ownerRemaining, setOwnerRemaining] = useState(0);
  const [taxRemaining, setTaxRemaining] = useState(0);
  const [reinvestRemaining, setReinvestRemaining] = useState(0);
  const [hasPeriodPlan, setHasPeriodPlan] = useState(false);
  const [trendLoading, setTrendLoading] = useState(true);
  const [mtdProfit, setMtdProfit] = useState<number | null>(null);
  const [priorMonthProfit, setPriorMonthProfit] = useState<number | null>(null);
  const [mtdShowCount, setMtdShowCount] = useState<number | null>(null);
  const [priorMonthShowCount, setPriorMonthShowCount] = useState<number | null>(
    null,
  );
  const [trendProfitUnavailable, setTrendProfitUnavailable] = useState(false);
  const [trendShowsUnavailable, setTrendShowsUnavailable] = useState(false);
  const [priorComparisonAvailable, setPriorComparisonAvailable] =
    useState(false);
  const [trendVendorBalance, setTrendVendorBalance] = useState<number | null>(
    null,
  );
  const [priorVendorBalance, setPriorVendorBalance] = useState<number | null>(
    null,
  );
  const [
    vendorSnapshotComparisonAvailable,
    setVendorSnapshotComparisonAvailable,
  ] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const effectRunIdRef = useRef(0);
  const overviewRunIdRef = useRef(0);
  const trendRunIdRef = useRef(0);
  const monthBounds = useMemo(() => getMonthToDateBounds(), []);

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
          const total = await fetchCompletedShowProfitTotal(
            weekBounds.startStr,
            weekBounds.endStr,
          );
          if (!cancelled && effectRunIdRef.current === runId) {
            setWeekProfit(total);
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

  useEffect(() => {
    const runId = ++overviewRunIdRef.current;
    let cancelled = false;
    setOverviewLoading(true);
    setPurchasesError(false);
    setBusinessHealthError(false);

    Promise.all([
      Promise.all([
        fetchInventoryInvested(PURCHASES_LOOKBACK_DAYS),
        fetchInventoryPurchases(PURCHASES_LOOKBACK_DAYS),
        fetchBusinessExpensesTotal(PURCHASES_LOOKBACK_DAYS),
        fetchBusinessExpenses(PURCHASES_LOOKBACK_DAYS),
      ])
        .then(
          ([
            inventoryInvested,
            purchaseRows,
            expensesTotalResponse,
            expenseRows,
          ]) => {
            if (cancelled || overviewRunIdRef.current !== runId) return;
            setInventoryTotal(parseAmount(inventoryInvested.total));
            setInventoryPurchases(purchaseRows);
            setExpensesTotal(parseAmount(expensesTotalResponse.total));
            setBusinessExpenses(expenseRows);
          },
        )
        .catch(() => {
          if (cancelled || overviewRunIdRef.current !== runId) return;
          setPurchasesError(true);
          setInventoryTotal(null);
          setInventoryPurchases([]);
          setExpensesTotal(null);
          setBusinessExpenses([]);
        }),
      Promise.all([
        getOwnerSelfPayWeeklyPayout(weekBounds.startStr),
        getPeriodAllocations(weekBounds.startStr),
      ])
        .then(([payout, allocations]) => {
          if (cancelled || overviewRunIdRef.current !== runId) return;
          const remaining = computeBusinessHealthRemaining({
            taxTarget: payout.taxReserve,
            reinvestTarget: payout.reinvestmentReserve,
            ownerTarget: payout.allowedPayoutForPeriod,
            taxRecorded: allocations.taxSetAside.recorded,
            reinvestRecorded: allocations.reinvestmentSetAside.recorded,
            ownerRecorded: payout.ownerPaidThisPeriod,
            completedShowCount: payout.completedShowCount,
          });
          setOwnerRemaining(remaining.ownerRemaining);
          setTaxRemaining(remaining.taxRemaining);
          setReinvestRemaining(remaining.reinvestRemaining);
          setHasPeriodPlan(remaining.hasPeriodPlan);
        })
        .catch(() => {
          if (cancelled || overviewRunIdRef.current !== runId) return;
          setBusinessHealthError(true);
          setOwnerRemaining(0);
          setTaxRemaining(0);
          setReinvestRemaining(0);
          setHasPeriodPlan(false);
        }),
    ]).finally(() => {
      if (!cancelled && overviewRunIdRef.current === runId) {
        setOverviewLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, weekBounds.startStr]);

  useEffect(() => {
    const runId = ++trendRunIdRef.current;
    let cancelled = false;
    setTrendLoading(true);
    setTrendProfitUnavailable(false);
    setTrendShowsUnavailable(showsError != null);
    setPriorComparisonAvailable(false);
    setTrendVendorBalance(null);
    setPriorVendorBalance(null);
    setVendorSnapshotComparisonAvailable(false);
    setMtdProfit(null);
    setPriorMonthProfit(null);
    setMtdShowCount(null);
    setPriorMonthShowCount(null);

    const priorBounds = getComparablePriorMonthBounds(monthBounds);
    const showList = shows ?? [];

    const setMtdShowCountFromShows = () => {
      if (showsError != null) {
        setTrendShowsUnavailable(true);
        setMtdShowCount(null);
        return;
      }
      setMtdShowCount(
        countCompletedShowsInRange(
          showList,
          monthBounds.startStr,
          monthBounds.endStr,
        ),
      );
    };

    const setPriorShowCountFromShows = () => {
      if (priorBounds == null || showsError != null) return;
      setPriorMonthShowCount(
        countCompletedShowsInRange(
          showList,
          priorBounds.startStr,
          priorBounds.endStr,
        ),
      );
      setPriorComparisonAvailable(true);
    };

    const profitRequests: Promise<void>[] = [
      fetchCompletedShowProfit(monthBounds.startStr, monthBounds.endStr)
        .then((mtd) => {
          if (cancelled || trendRunIdRef.current !== runId) return;
          const total = Number(mtd.total_profit);
          setMtdProfit(Number.isFinite(total) ? total : 0);
          setMtdShowCount(mtd.show_count);
        })
        .catch(() => {
          if (cancelled || trendRunIdRef.current !== runId) return;
          setTrendProfitUnavailable(true);
          setMtdProfit(null);
          setMtdShowCountFromShows();
        }),
    ];

    if (priorBounds != null) {
      profitRequests.push(
        fetchCompletedShowProfit(priorBounds.startStr, priorBounds.endStr)
          .then((prior) => {
            if (cancelled || trendRunIdRef.current !== runId) return;
            const total = Number(prior.total_profit);
            setPriorMonthProfit(Number.isFinite(total) ? total : 0);
            setPriorMonthShowCount(prior.show_count);
            setPriorComparisonAvailable(true);
          })
          .catch(() => {
            if (cancelled || trendRunIdRef.current !== runId) return;
            setPriorMonthProfit(null);
            setPriorShowCountFromShows();
          }),
      );
    }

    const snapshotRequests: Promise<void>[] = [];
    if (priorBounds != null && balancesError == null) {
      snapshotRequests.push(
        fetchWholesalerBalanceSnapshots([
          monthBounds.endStr,
          priorBounds.endStr,
        ])
          .then((response) => {
            if (cancelled || trendRunIdRef.current !== runId) return;
            const byDate = new Map(
              response.snapshots.map((snapshot) => [
                snapshot.as_of,
                Number(snapshot.total_outstanding),
              ]),
            );
            const current = byDate.get(monthBounds.endStr);
            const prior = byDate.get(priorBounds.endStr);
            if (current != null && Number.isFinite(current)) {
              setTrendVendorBalance(current);
            }
            if (prior != null && Number.isFinite(prior)) {
              setPriorVendorBalance(prior);
            }
            if (
              current != null &&
              Number.isFinite(current) &&
              prior != null &&
              Number.isFinite(prior)
            ) {
              setVendorSnapshotComparisonAvailable(true);
            }
          })
          .catch(() => {
            if (cancelled || trendRunIdRef.current !== runId) return;
            setTrendVendorBalance(null);
            setPriorVendorBalance(null);
            setVendorSnapshotComparisonAvailable(false);
          }),
      );
    }

    Promise.all([...profitRequests, ...snapshotRequests]).finally(() => {
      if (!cancelled && trendRunIdRef.current === runId) {
        setTrendLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, monthBounds, shows, showsError, balancesError]);

  const heroSummary = useMemo(() => {
    return buildDashboardHeroSummary(
      {
        shows: shows ?? [],
        weekProfit,
        weekProfitError,
        totalVendorBalance:
          balances === null ? null : sumVendorBalanceTotal(balances),
        balancesError,
        showsError,
        completedThisWeekCount: countCompletedShowsThisWeek(
          shows ?? [],
          weekBounds.startStr,
          weekBounds.endStr,
        ),
        openShowsCount: countActiveShows(shows ?? []),
      },
      formatCurrency,
    );
  }, [
    weekProfit,
    weekProfitError,
    balances,
    balancesError,
    showsError,
    shows,
    weekBounds.startStr,
    weekBounds.endStr,
  ]);

  const workspaceCards = useMemo(() => {
    return buildDashboardWorkspaceCards({
      shows: shows ?? [],
      weekStartStr: weekBounds.startStr,
      weekEndStr: weekBounds.endStr,
      showsError,
      balances: balances ?? [],
      balancesError,
      inventoryTotal,
      expensesTotal,
      purchases: inventoryPurchases,
      expenses: businessExpenses,
      purchasesError,
      ownerRemaining,
      taxRemaining,
      reinvestRemaining,
      hasPeriodPlan,
      businessHealthError,
      formatCurrency,
    });
  }, [
    shows,
    weekBounds.startStr,
    weekBounds.endStr,
    showsError,
    balances,
    balancesError,
    inventoryTotal,
    expensesTotal,
    inventoryPurchases,
    businessExpenses,
    purchasesError,
    ownerRemaining,
    taxRemaining,
    reinvestRemaining,
    hasPeriodPlan,
    businessHealthError,
  ]);

  const trendStrip = useMemo(() => {
    const balanceTotal =
      balances === null ? null : sumVendorBalanceTotal(balances);
    return buildDashboardTrendStrip({
      mtdProfit,
      priorMonthProfit,
      mtdShowCount,
      priorMonthShowCount,
      totalVendorBalance: trendVendorBalance ?? balanceTotal,
      priorVendorBalance,
      profitUnavailable: trendProfitUnavailable,
      showsUnavailable: trendShowsUnavailable || showsError != null,
      vendorBalanceUnavailable: balancesError != null,
      priorComparisonAvailable,
      vendorSnapshotComparisonAvailable,
      formatCurrency,
    });
  }, [
    mtdProfit,
    priorMonthProfit,
    mtdShowCount,
    priorMonthShowCount,
    balances,
    trendVendorBalance,
    priorVendorBalance,
    trendProfitUnavailable,
    trendShowsUnavailable,
    showsError,
    balancesError,
    priorComparisonAvailable,
    vendorSnapshotComparisonAvailable,
  ]);

  if (loading) {
    return (
      <AdminWorkspacePageLayout containerTier="hub" pageHeader={pageHeader}>
        <DashboardContentSkeleton />
      </AdminWorkspacePageLayout>
    );
  }

  return (
    <AdminWorkspacePageLayout containerTier="hub" pageHeader={pageHeader}>
      <WorkspaceGrid variant="stack">
        <WorkspaceGridItem span="full">
          <DashboardWeekHero
            weekRangeLabel={formatWeekRangeCompact(weekBounds)}
            summary={heroSummary}
            weekProfitError={weekProfitError}
            onRetry={() => setReloadToken((v) => v + 1)}
          />
        </WorkspaceGridItem>
        <WorkspaceGridItem span="full">
          <DashboardWorkspaceOverview
            cards={workspaceCards}
            loading={overviewLoading}
          />
        </WorkspaceGridItem>
        <WorkspaceGridItem span="full">
          <DashboardTrendStrip model={trendStrip} loading={trendLoading} />
        </WorkspaceGridItem>
      </WorkspaceGrid>
    </AdminWorkspacePageLayout>
  );
}
