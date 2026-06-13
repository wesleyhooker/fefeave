"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dispatchWorkspaceInvalidate } from "@/lib/workspaceInvalidate";
import { getCurrentWeekBounds } from "@/lib/weekRange";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import { WorkspacePageWithRightPanel } from "@/app/(admin)/admin/_components/WorkspacePageWithRightPanel";
import {
  WORKFLOW_BH_RECORD_OWNER_PAYOUT_PANEL_TITLE,
  WORKFLOW_BH_RECORD_REINVEST_PANEL_TITLE,
  WORKFLOW_BH_RECORD_TAX_PANEL_TITLE,
  WORKFLOW_BUSINESS_HEALTH_SUBTITLE,
  WORKFLOW_BUSINESS_HEALTH_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  getOwnerActivityPage,
  getOwnerSelfPayWeeklyPayout,
  type OwnerPayoutSourceContextDTO,
  type OwnerWeeklyPayoutDTO,
} from "@/src/lib/api/ownerSelfPay";
import {
  deriveOwnerWeekStatus,
  type OwnerWeekStatus,
} from "./owner-draw/ownerWeekStatus";
import { CashPositionSection } from "./CashPositionSection";
import { BusinessHealthSummaryCard } from "./BusinessHealthSummaryCard";
import {
  ExecutionTrackingSection,
  type ExecutionPanelKind,
} from "./ExecutionTrackingSection";
import { RecordSetAsideForm } from "./RecordSetAsideForm";
import { RecordOwnerPayoutForm } from "./RecordOwnerPayoutForm";
import { OwnerPayoutHistorySection } from "./owner-draw/OwnerPayoutHistorySection";
import { findCurrentWeekTransactions } from "./owner-draw/ownerWeekStatus";

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function BusinessHealthPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-48 animate-pulse rounded-lg border border-stone-200/90 bg-white/90 lg:col-span-8" />
        <div className="h-48 animate-pulse rounded-lg border border-stone-200/90 bg-white/90 lg:col-span-4" />
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-stone-200/90 bg-white/90" />
      <div className="h-48 animate-pulse rounded-lg border border-stone-200/90 bg-white/90" />
    </div>
  );
}

export default function BusinessHealthPageContent() {
  const weekBounds = useMemo(() => getCurrentWeekBounds(), []);
  const [reloadToken, setReloadToken] = useState(0);
  const [panel, setPanel] = useState<ExecutionPanelKind | null>(null);
  const [panelRemaining, setPanelRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Awaited<
    ReturnType<typeof getOwnerActivityPage>
  > | null>(null);
  const [weeklyPayout, setWeeklyPayout] = useState<OwnerWeeklyPayoutDTO | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [page, payout] = await Promise.all([
        getOwnerActivityPage(200),
        getOwnerSelfPayWeeklyPayout(weekBounds.startStr),
      ]);
      setActivity(page);
      setWeeklyPayout(payout);
    } catch (e) {
      setActivity(null);
      setWeeklyPayout(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [weekBounds.startStr]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const currentWeek = useMemo(() => {
    if (!activity) {
      return {
        active: null,
        voided: null,
        paidThisPeriod: 0,
        sourceContext: null as OwnerPayoutSourceContextDTO | null,
      };
    }
    const { active, voided } = findCurrentWeekTransactions(
      activity.transactions,
      weekBounds.startStr,
    );
    const weekTx = activity.transactions.find(
      (tx) => tx.weekStartDate === weekBounds.startStr,
    );
    return {
      active,
      voided,
      paidThisPeriod: active && !active.voidedAt ? toNum(active.amount) : 0,
      sourceContext: weekTx?.sourceContext ?? null,
    };
  }, [activity, weekBounds.startStr]);

  const bumpReload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const currentPeriodStatus: OwnerWeekStatus | null = useMemo(() => {
    if (!weeklyPayout) return null;
    const allowed = toNum(weeklyPayout.allowedPayoutForPeriod);
    const paid =
      currentWeek.active && !currentWeek.active.voidedAt
        ? toNum(currentWeek.active.amount)
        : toNum(weeklyPayout.ownerPaidThisPeriod);
    return deriveOwnerWeekStatus({
      remainingAmount: toNum(weeklyPayout.remainingAvailablePayout),
      ownerPaidThisPeriod: paid,
      allowedPayoutForPeriod: allowed,
      hasActivePayout:
        currentWeek.active != null && !currentWeek.active.voidedAt,
      hasVoidedThisWeek: currentWeek.voided != null,
    });
  }, [weeklyPayout, currentWeek]);

  const openPanel = useCallback(
    (kind: ExecutionPanelKind, remaining: number) => {
      setPanelRemaining(remaining);
      setPanel(kind);
    },
    [],
  );

  const panelTitle =
    panel === "tax"
      ? WORKFLOW_BH_RECORD_TAX_PANEL_TITLE
      : panel === "reinvest"
        ? WORKFLOW_BH_RECORD_REINVEST_PANEL_TITLE
        : panel === "owner"
          ? WORKFLOW_BH_RECORD_OWNER_PAYOUT_PANEL_TITLE
          : "";

  const handleRecorded = useCallback(() => {
    dispatchWorkspaceInvalidate();
    setPanel(null);
    bumpReload();
  }, [bumpReload]);

  if (loading) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        intro={
          <AdminWorkspacePageIntro
            title={WORKFLOW_BUSINESS_HEALTH_TITLE}
            subtitle={WORKFLOW_BUSINESS_HEALTH_SUBTITLE}
          />
        }
      >
        <BusinessHealthPageSkeleton />
      </AdminWorkspacePageLayout>
    );
  }

  if (error != null || activity == null) {
    return (
      <AdminWorkspacePageLayout
        containerTier="full"
        intro={
          <AdminWorkspacePageIntro
            title={WORKFLOW_BUSINESS_HEALTH_TITLE}
            subtitle={WORKFLOW_BUSINESS_HEALTH_SUBTITLE}
          />
        }
      >
        <WorkspaceInlineError
          title="Could not load business health"
          message="Check your connection and retry."
          onRetry={() => void load()}
        >
          <p className="mt-1 text-xs text-amber-900">{error}</p>
        </WorkspaceInlineError>
      </AdminWorkspacePageLayout>
    );
  }

  return (
    <WorkspacePageWithRightPanel
      open={panel != null}
      onClose={() => setPanel(null)}
      title={panelTitle}
      panelSubtitle={weekBounds.labelLong}
      panel={
        panel === "tax" ? (
          <RecordSetAsideForm
            weekStartDate={weekBounds.startStr}
            allocationType="TAX_SET_ASIDE"
            remainingAmount={panelRemaining}
            onSuccess={handleRecorded}
          />
        ) : panel === "reinvest" ? (
          <RecordSetAsideForm
            weekStartDate={weekBounds.startStr}
            allocationType="REINVESTMENT_SET_ASIDE"
            remainingAmount={panelRemaining}
            onSuccess={handleRecorded}
          />
        ) : panel === "owner" ? (
          <RecordOwnerPayoutForm
            weekStartDate={weekBounds.startStr}
            weekEndDate={weekBounds.endStr}
            remainingAmount={panelRemaining}
            onSuccess={handleRecorded}
          />
        ) : null
      }
    >
      <AdminWorkspacePageLayout
        containerTier="full"
        intro={
          <AdminWorkspacePageIntro
            title={WORKFLOW_BUSINESS_HEALTH_TITLE}
            subtitle={WORKFLOW_BUSINESS_HEALTH_SUBTITLE}
          />
        }
      >
        <WorkspaceGrid variant="twelve" className="gap-6 md:gap-7">
          <WorkspaceGridItem span="primary">
            <CashPositionSection
              reloadToken={reloadToken}
              onSnapshotSaved={bumpReload}
            />
          </WorkspaceGridItem>

          <WorkspaceGridItem span="secondary">
            <BusinessHealthSummaryCard
              weekBounds={weekBounds}
              reloadToken={reloadToken}
            />
          </WorkspaceGridItem>

          <WorkspaceGridItem span="full">
            <ExecutionTrackingSection
              weekStartYmd={weekBounds.startStr}
              weekEndYmd={weekBounds.endStr}
              reloadToken={reloadToken}
              panel={panel}
              onOpenPanel={openPanel}
              hasActiveOwnerPayout={
                currentWeek.active != null && !currentWeek.active.voidedAt
              }
              onPayoutChanged={bumpReload}
            />
          </WorkspaceGridItem>

          <WorkspaceGridItem span="full">
            <OwnerPayoutHistorySection
              transactions={activity.transactions}
              currentWeekStartStr={weekBounds.startStr}
              currentPeriodTransaction={
                currentWeek.active ?? currentWeek.voided
              }
              currentPeriodStatus={currentPeriodStatus}
            />
          </WorkspaceGridItem>
        </WorkspaceGrid>
      </AdminWorkspacePageLayout>
    </WorkspacePageWithRightPanel>
  );
}
