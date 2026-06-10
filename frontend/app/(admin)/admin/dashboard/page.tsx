"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import { fetchShows, type ShowDTO } from "@/src/lib/api/shows";
import {
  fetchShowFinancialSummariesByShowIds,
  fetchCompletedShowProfitTotal,
  type ShowFinancialSummary,
} from "@/app/(admin)/admin/_lib/showFinancialSummary";
import {
  formatWeekRangeCompact,
  getCurrentWeekBounds,
  isDateInWeek,
} from "@/lib/weekRange";
import {
  deriveOwnerDrawWeekStatus,
  formatOwnerDrawDashboardTeaser,
} from "@/app/(admin)/admin/_lib/ownerDrawStatus";
import {
  loadSelfPayAndPayoutServer,
  type OwnerWeeklyPayoutState,
  type SelfPayStored,
} from "./selfPayStorage";
import {
  getOwnerActivityPage,
  getOwnerSelfPayWeeklyPayout,
} from "@/src/lib/api/ownerSelfPay";
import { findCurrentWeekTransactions } from "@/app/(admin)/admin/business-health/owner-draw/ownerWeekStatus";
import { showCloseOutHref } from "@/app/(admin)/admin/_lib/showRoutes";
import { formatCurrency } from "@/lib/format";
import { DASHBOARD_THIS_WEEK_SHOWS_LIMIT } from "./constants";
import { WorkspaceGrid, WorkspaceGridItem } from "../_components/WorkspaceGrid";
import {
  buildWorkspaceAttentionItems,
  countActiveShows,
  countVendorsOwing,
  parseBalanceAmount,
} from "../_lib/workspaceAttentionItems";
import { DashboardNeedsAttentionCard } from "./_components/DashboardNeedsAttentionCard";
import { DashboardBusinessSnapshot } from "./_components/DashboardBusinessSnapshot";
import { DashboardPageHeader } from "./_components/DashboardPageHeader";
import { DashboardThisWeekCard } from "./_components/DashboardThisWeekCard";
import { DashboardRecentActivityCard } from "./_components/DashboardRecentActivityCard";
import { DashboardQuickActions } from "./_components/DashboardQuickActions";
import { AdminWorkspacePageLayout } from "../_components/AdminWorkspacePageLayout";
import { WorkspacePageWithRightPanel } from "../_components/WorkspacePageWithRightPanel";
import { ShowCreateForm } from "../shows/new/ShowCreateForm";
import {
  WORKFLOW_LOG_SHOW_PANEL_SUBTITLE,
  WORKFLOW_LOG_SHOW_PANEL_TITLE,
} from "../_lib/adminWorkflowCopy";
import { fetchFinancialActivity } from "@/src/lib/api/financial-activity";
import type { FinancialActivityEventDTO } from "@/src/lib/api/financial-activity";
import { fetchBusinessExpensesTotal } from "@/src/lib/api/business-expenses";
import { fetchInventoryInvested } from "@/src/lib/api/inventory-purchases";

const RECENT_ACTIVITY_LIMIT = 5;
const SNAPSHOT_LOOKBACK_DAYS = 30;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isCreateShowOpen, setIsCreateShowOpen] = useState(false);
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
  const [weeklyPayoutState, setWeeklyPayoutState] =
    useState<OwnerWeeklyPayoutState>({
      amount: 0,
      canRecordPayout: false,
    });
  const [ownerDrawPaidThisPeriod, setOwnerDrawPaidThisPeriod] = useState(0);
  const [ownerDrawAllowed, setOwnerDrawAllowed] = useState(0);
  const [ownerDrawVoidedThisWeek, setOwnerDrawVoidedThisWeek] = useState(false);
  const [weekPreviewSummaries, setWeekPreviewSummaries] = useState<
    Record<string, ShowFinancialSummary>
  >({});

  const [expensesTotal30, setExpensesTotal30] = useState<number | null>(null);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [inventoryTotal30, setInventoryTotal30] = useState<number | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  const [recentActivity, setRecentActivity] = useState<
    FinancialActivityEventDTO[] | null
  >(null);
  const [recentActivityError, setRecentActivityError] = useState<string | null>(
    null,
  );
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [activityReloadToken, setActivityReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadSelfPayAndPayoutServer({ weekStartYmd: weekBounds.startStr }),
      getOwnerSelfPayWeeklyPayout(weekBounds.startStr),
      getOwnerActivityPage(50),
    ])
      .then(([{ selfPay: selfPayState, payout }, payoutDto, activity]) => {
        if (!cancelled) {
          setSelfPay(selfPayState);
          setWeeklyPayoutState(payout);
          setOwnerDrawPaidThisPeriod(
            Number(payoutDto.ownerPaidThisPeriod) || 0,
          );
          setOwnerDrawAllowed(Number(payoutDto.allowedPayoutForPeriod) || 0);
          const { voided } = findCurrentWeekTransactions(
            activity.transactions,
            weekBounds.startStr,
          );
          setOwnerDrawVoidedThisWeek(voided != null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelfPay({ paid: false });
          setWeeklyPayoutState({ amount: 0, canRecordPayout: false });
          setOwnerDrawPaidThisPeriod(0);
          setOwnerDrawAllowed(0);
          setOwnerDrawVoidedThisWeek(false);
        }
      });
    return () => {
      cancelled = true;
    };
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
    fetchShowFinancialSummariesByShowIds(list.map((show) => show.id)).then(
      (next) => {
        if (cancelled) return;
        setWeekPreviewSummaries(next);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [shows, weekBounds.startStr, weekBounds.endStr]);

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
    let cancelled = false;
    setSnapshotLoading(true);
    setExpensesError(null);
    setInventoryError(null);

    Promise.allSettled([
      fetchBusinessExpensesTotal(SNAPSHOT_LOOKBACK_DAYS),
      fetchInventoryInvested(SNAPSHOT_LOOKBACK_DAYS),
    ])
      .then(([expensesResult, inventoryResult]) => {
        if (cancelled) return;
        if (expensesResult.status === "fulfilled") {
          setExpensesTotal30(parseBalanceAmount(expensesResult.value.total));
        } else {
          setExpensesError(
            expensesResult.reason instanceof Error
              ? expensesResult.reason.message
              : String(expensesResult.reason),
          );
        }
        if (inventoryResult.status === "fulfilled") {
          setInventoryTotal30(parseBalanceAmount(inventoryResult.value.total));
        } else {
          setInventoryError(
            inventoryResult.reason instanceof Error
              ? inventoryResult.reason.message
              : String(inventoryResult.reason),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSnapshotLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    setRecentActivityLoading(true);
    setRecentActivityError(null);

    fetchFinancialActivity({ limit: RECENT_ACTIVITY_LIMIT, page: 1 })
      .then((response) => {
        if (!cancelled) setRecentActivity(response.items);
      })
      .catch((e) => {
        if (!cancelled) {
          setRecentActivityError(
            e instanceof Error ? e.message : "Could not load activity.",
          );
          setRecentActivity(null);
        }
      })
      .finally(() => {
        if (!cancelled) setRecentActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activityReloadToken]);

  const openShowsCount = useMemo(() => countActiveShows(shows ?? []), [shows]);

  const vendorsOwingCount = useMemo(
    () => countVendorsOwing(balances ?? []),
    [balances],
  );

  const totalVendorBalance = useMemo(() => {
    if (balances === null) return null;
    return balances.reduce(
      (sum, r) => sum + parseBalanceAmount(r.balance_owed),
      0,
    );
  }, [balances]);

  const attentionItems = useMemo(
    () =>
      buildWorkspaceAttentionItems({
        showsError,
        balancesError,
        openShowsCount,
        vendorsOwingCount,
        totalOutstandingBalance: totalVendorBalance,
      }),
    [
      showsError,
      balancesError,
      openShowsCount,
      vendorsOwingCount,
      totalVendorBalance,
    ],
  );

  const { showsThisWeek, showsThisWeekTotal, completedThisWeekCount } =
    useMemo(() => {
      const inWeek = (shows ?? []).filter((s) =>
        isDateInWeek(s.show_date, weekBounds.startStr, weekBounds.endStr),
      );
      const sorted = [...inWeek].sort(
        (a, b) =>
          new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
      );
      const completedThisWeek = sorted.filter(
        (s) => (s.status ?? "").toUpperCase() === "COMPLETED",
      ).length;
      return {
        showsThisWeek: sorted.slice(0, DASHBOARD_THIS_WEEK_SHOWS_LIMIT),
        showsThisWeekTotal: sorted.length,
        completedThisWeekCount: completedThisWeek,
      };
    }, [shows, weekBounds.startStr, weekBounds.endStr]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const hasActiveOwnerDraw = selfPay?.paid === true;
  const hasVoidedOwnerDraw = ownerDrawVoidedThisWeek;
  const ownerDrawStatus = deriveOwnerDrawWeekStatus({
    remainingAmount: weeklyPayoutState.amount,
    ownerPaidThisPeriod: ownerDrawPaidThisPeriod,
    allowedPayoutForPeriod: ownerDrawAllowed,
    hasActivePayout: hasActiveOwnerDraw,
    hasVoidedThisWeek: hasVoidedOwnerDraw,
  });
  const ownerPayoutPaidAtLabel =
    selfPay?.paidAt != null
      ? new Date(selfPay.paidAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;
  const ownerDrawTeaserLine = formatOwnerDrawDashboardTeaser({
    status: ownerDrawStatus,
    remainingAmount: weeklyPayoutState.amount,
    ownerPaidThisPeriod: ownerDrawPaidThisPeriod,
    paidAtLabel: ownerPayoutPaidAtLabel,
    formatCurrency,
  });

  const weekProfitDisplay =
    weekProfitError != null ? null : weekProfit !== null ? weekProfit : null;

  const weekProfitPending = weekProfit === null && weekProfitError == null;

  return (
    <WorkspacePageWithRightPanel
      open={isCreateShowOpen}
      onClose={() => setIsCreateShowOpen(false)}
      title={WORKFLOW_LOG_SHOW_PANEL_TITLE}
      panelSubtitle={WORKFLOW_LOG_SHOW_PANEL_SUBTITLE}
      panel={
        <ShowCreateForm
          variant="drawer"
          onSuccess={(show) => {
            setIsCreateShowOpen(false);
            router.push(showCloseOutHref(show.id));
          }}
          onCancel={() => setIsCreateShowOpen(false)}
        />
      }
    >
      <AdminWorkspacePageLayout
        containerTier="full"
        intro={
          <DashboardPageHeader
            weekRangeLabel={formatWeekRangeCompact(weekBounds)}
            weekStartYmd={weekBounds.startStr}
            newShowPanelOpen={isCreateShowOpen}
            onNewShowClick={() => setIsCreateShowOpen(true)}
          />
        }
      >
        <WorkspaceGrid variant="stack">
          <WorkspaceGrid variant="twelve">
            <WorkspaceGridItem span="primary">
              <DashboardNeedsAttentionCard
                items={attentionItems}
                onRetry={() => setReloadToken((v) => v + 1)}
              />
            </WorkspaceGridItem>
            <WorkspaceGridItem span="secondary">
              <DashboardQuickActions
                onLogShowClick={() => setIsCreateShowOpen(true)}
              />
            </WorkspaceGridItem>
          </WorkspaceGrid>

          <WorkspaceGrid variant="twelve">
            <WorkspaceGridItem span="primary">
              <DashboardThisWeekCard
                weekRangeLabel={formatWeekRangeCompact(weekBounds)}
                weekProfitError={weekProfitError}
                weekProfitDisplay={weekProfitDisplay}
                showsError={showsError}
                onRetryShows={() => setReloadToken((v) => v + 1)}
                showsThisWeek={showsThisWeek}
                weekPreviewSummaries={weekPreviewSummaries}
                showsThisWeekTotal={showsThisWeekTotal}
                showsLimit={DASHBOARD_THIS_WEEK_SHOWS_LIMIT}
                completedThisWeekCount={completedThisWeekCount}
                ownerDrawTeaserLine={ownerDrawTeaserLine}
              />
            </WorkspaceGridItem>
            <WorkspaceGridItem span="secondary">
              <DashboardBusinessSnapshot
                weekProfit={weekProfit}
                weekProfitError={weekProfitError}
                weekProfitPending={weekProfitPending}
                totalVendorBalance={totalVendorBalance}
                balancesError={balancesError}
                expensesTotal30={expensesTotal30}
                expensesError={expensesError}
                expensesPending={snapshotLoading && expensesTotal30 === null}
                inventoryTotal30={inventoryTotal30}
                inventoryError={inventoryError}
                inventoryPending={snapshotLoading && inventoryTotal30 === null}
                completedShowsThisWeek={completedThisWeekCount}
                showsError={showsError}
              />
            </WorkspaceGridItem>
          </WorkspaceGrid>

          <WorkspaceGrid variant="twelve">
            <WorkspaceGridItem span="full">
              <DashboardRecentActivityCard
                events={recentActivity}
                loading={recentActivityLoading}
                error={recentActivityError}
                onRetry={() => setActivityReloadToken((v) => v + 1)}
              />
            </WorkspaceGridItem>
          </WorkspaceGrid>
        </WorkspaceGrid>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
