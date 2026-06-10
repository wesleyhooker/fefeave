"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import {
  BUSINESS_HEALTH_HREF,
  SETTINGS_FINANCIAL_HREF,
  SHOWS_HREF,
} from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_BH_COL_ACTION,
  WORKFLOW_BH_COL_RECORDED,
  WORKFLOW_BH_COL_REMAINING,
  WORKFLOW_BH_COL_STATUS,
  WORKFLOW_BH_COL_TARGET,
  WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING,
  WORKFLOW_BH_EXECUTION_TRACKING_INTRO,
  WORKFLOW_BH_EXECUTION_UNAVAILABLE,
  WORKFLOW_BH_RECORD_REINVESTMENT,
  WORKFLOW_BH_RECORD_TAX_SET_ASIDE,
  WORKFLOW_BH_ROW_OWNER_PAYOUT,
  WORKFLOW_BH_ROW_REINVESTMENT,
  WORKFLOW_BH_ROW_TAX_SET_ASIDE,
  WORKFLOW_BH_SET_ASIDE_ENTRIES_VOID_HINT,
  WORKFLOW_BH_VIEW_LEDGER_ROW,
  WORKFLOW_BH_VIEW_PAYOUT_HISTORY,
  WORKFLOW_BH_VIEW_SET_ASIDE_ENTRIES,
  WORKFLOW_BH_VOID_OWNER_PAYOUT_CONFIRM,
  WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_DESC,
  WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_TITLE,
  WORKFLOW_BH_VOID_OWNER_PAYOUT_LABEL,
  WORKFLOW_OWNER_RECORD_PAYOUT_LABEL,
  WORKFLOW_OWNER_USING_STRATEGY_PREFIX,
  WORKFLOW_OWNER_USING_STRATEGY_SUFFIX,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { strategyDisplayLabel } from "@/app/(admin)/admin/business-health/owner-draw/useOwnerFinancialStrategy";
import { ownerPayoutLedgerHref } from "@/app/(admin)/admin/business-health/owner-draw/ownerLedgerLinks";
import { PeriodPlanWaterfall } from "./PeriodPlanWaterfall";
import {
  workspaceActionSecondarySm,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  getOwnerSelfPayWeeklyPayout,
  voidOwnerSelfPayWeek,
  type OwnerWeeklyPayoutDTO,
} from "@/src/lib/api/ownerSelfPay";
import { getPeriodAllocations } from "@/src/lib/api/strategyAllocations";
import {
  reinvestmentSetAsideLedgerHref,
  taxSetAsideLedgerHref,
} from "./executionLedgerLinks";
import {
  computeExecutionRemaining,
  deriveExecutionRowStatus,
  executionRowStatusLabel,
  toMoneyNum,
  type ExecutionRowKind,
  type ExecutionRowStatus,
} from "./executionTracking";
import { SetAsideEntriesPanel } from "./SetAsideEntriesPanel";

type ExecutionRow = {
  id: string;
  label: string;
  kind: ExecutionRowKind;
  target: number;
  recorded: number;
  remaining: number;
  status: ExecutionRowStatus;
  statusLabel: string;
  recordedHref: string | null;
  historyHref: string | null;
  emphasize?: boolean;
  action: ReactNode;
};

export type ExecutionPanelKind = "tax" | "reinvest" | "owner";

function statusToneClass(status: ExecutionRowStatus): string {
  switch (status) {
    case "complete":
      return "text-emerald-800";
    case "partial":
      return "text-amber-800";
    case "not_started":
      return "text-stone-600";
    case "no_target":
      return "text-stone-500";
    default:
      return "text-stone-600";
  }
}

export function ExecutionTrackingSection({
  weekStartYmd,
  weekEndYmd,
  reloadToken,
  panel,
  onOpenPanel,
  hasActiveOwnerPayout,
  onPayoutChanged,
}: {
  weekStartYmd: string;
  weekEndYmd: string;
  reloadToken: number;
  panel: ExecutionPanelKind | null;
  onOpenPanel: (kind: ExecutionPanelKind, remaining: number) => void;
  hasActiveOwnerPayout: boolean;
  onPayoutChanged?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payout, setPayout] = useState<OwnerWeeklyPayoutDTO | null>(null);
  const [allocations, setAllocations] = useState<Awaited<
    ReturnType<typeof getPeriodAllocations>
  > | null>(null);
  const [voidOwnerOpen, setVoidOwnerOpen] = useState(false);
  const [voidingOwner, setVoidingOwner] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [weeklyPayout, allocationData] = await Promise.all([
        getOwnerSelfPayWeeklyPayout(weekStartYmd),
        getPeriodAllocations(weekStartYmd),
      ]);
      setPayout(weeklyPayout);
      setAllocations(allocationData);
    } catch (e) {
      setPayout(null);
      setAllocations(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [weekStartYmd]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const taxRecorded = toMoneyNum(allocations?.taxSetAside.recorded);
  const reinvestRecorded = toMoneyNum(
    allocations?.reinvestmentSetAside.recorded,
  );

  const confirmVoidOwner = useCallback(async () => {
    setVoidingOwner(true);
    try {
      await voidOwnerSelfPayWeek(weekStartYmd);
      setVoidOwnerOpen(false);
      onPayoutChanged?.();
      await load();
    } finally {
      setVoidingOwner(false);
    }
  }, [weekStartYmd, onPayoutChanged, load]);

  const rows: ExecutionRow[] = useMemo(() => {
    if (!payout) return [];

    const ledgerWeek = { weekStart: weekStartYmd, weekEnd: weekEndYmd };

    const buildRow = (args: {
      id: string;
      label: string;
      kind: ExecutionRowKind;
      target: number;
      recorded: number;
      recordedHref: string | null;
      historyHref: string;
      emphasize?: boolean;
      recordLabel: string;
      panelKind: ExecutionPanelKind;
      recordVariant?: "default" | "primary";
      extraAction?: ReactNode;
    }): ExecutionRow => {
      const remaining = computeExecutionRemaining(args.target, args.recorded);
      const status = deriveExecutionRowStatus(
        args.target,
        args.recorded,
        remaining,
      );
      const canRecord = remaining > 0;

      return {
        id: args.id,
        label: args.label,
        kind: args.kind,
        target: args.target,
        recorded: args.recorded,
        remaining,
        status,
        statusLabel: executionRowStatusLabel(status, args.kind),
        recordedHref: args.recordedHref,
        historyHref: args.historyHref,
        emphasize: args.emphasize,
        action: (
          <div className="flex flex-col gap-2">
            {canRecord ? (
              <WorkspaceSidePanelTrigger
                label={args.recordLabel}
                variant={args.recordVariant ?? "default"}
                open={panel === args.panelKind}
                onClick={() => onOpenPanel(args.panelKind, remaining)}
              />
            ) : (
              <span className="text-xs text-stone-500">
                Nothing left to record
              </span>
            )}
            {args.extraAction}
          </div>
        ),
      };
    };

    const taxTarget = toMoneyNum(payout.taxReserve);
    const reinvestTarget = toMoneyNum(payout.reinvestmentReserve);
    const ownerTarget = toMoneyNum(payout.allowedPayoutForPeriod);
    const ownerRecorded = toMoneyNum(payout.ownerPaidThisPeriod);

    return [
      buildRow({
        id: "tax",
        label: WORKFLOW_BH_ROW_TAX_SET_ASIDE,
        kind: "set_aside",
        target: taxTarget,
        recorded: taxRecorded,
        recordedHref:
          taxRecorded > 0 ? taxSetAsideLedgerHref(ledgerWeek) : null,
        historyHref: `${BUSINESS_HEALTH_HREF}#execution-set-aside-entries`,
        recordLabel: WORKFLOW_BH_RECORD_TAX_SET_ASIDE,
        panelKind: "tax",
      }),
      buildRow({
        id: "reinvest",
        label: WORKFLOW_BH_ROW_REINVESTMENT,
        kind: "set_aside",
        target: reinvestTarget,
        recorded: reinvestRecorded,
        recordedHref:
          reinvestRecorded > 0
            ? reinvestmentSetAsideLedgerHref(ledgerWeek)
            : null,
        historyHref: `${BUSINESS_HEALTH_HREF}#execution-set-aside-entries`,
        recordLabel: WORKFLOW_BH_RECORD_REINVESTMENT,
        panelKind: "reinvest",
      }),
      buildRow({
        id: "owner",
        label: WORKFLOW_BH_ROW_OWNER_PAYOUT,
        kind: "owner_payout",
        target: ownerTarget,
        recorded: ownerRecorded,
        recordedHref:
          ownerRecorded > 0 ? ownerPayoutLedgerHref(ledgerWeek) : null,
        historyHref: `${BUSINESS_HEALTH_HREF}#owner-payout-history`,
        emphasize: true,
        recordLabel: WORKFLOW_OWNER_RECORD_PAYOUT_LABEL,
        panelKind: "owner",
        recordVariant: "primary",
        extraAction: hasActiveOwnerPayout ? (
          <button
            type="button"
            disabled={voidingOwner}
            onClick={() => setVoidOwnerOpen(true)}
            className={`${workspaceActionSecondarySm} w-full justify-center sm:w-auto`}
          >
            {WORKFLOW_BH_VOID_OWNER_PAYOUT_LABEL}
          </button>
        ) : null,
      }),
    ];
  }, [
    payout,
    taxRecorded,
    reinvestRecorded,
    weekStartYmd,
    weekEndYmd,
    panel,
    onOpenPanel,
    hasActiveOwnerPayout,
    voidingOwner,
  ]);

  const hasTargets = payout != null && payout.completedShowCount > 0;

  return (
    <WorkspaceCard
      id="execution-tracking"
      aria-label={WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING}
    >
      <WorkspaceCardHeader
        title={WORKFLOW_BH_THIS_PERIOD_PLAN_HEADING}
        titleClassName="text-lg font-semibold text-stone-900"
        actions={
          <Link
            href={SETTINGS_FINANCIAL_HREF}
            className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
          >
            Financial Preferences →
          </Link>
        }
      />
      <WorkspaceCardBody className="space-y-4">
        {loading ? (
          <div
            className="h-40 animate-pulse rounded-md bg-stone-100/80"
            aria-hidden
          />
        ) : error ? (
          <WorkspaceInlineError
            title="Could not load this period plan"
            message={error}
            onRetry={() => void load()}
          />
        ) : !hasTargets || !payout ? (
          <p className="text-sm text-stone-600">
            {WORKFLOW_BH_EXECUTION_UNAVAILABLE}{" "}
            <Link
              href={SHOWS_HREF}
              className="font-medium text-stone-800 underline-offset-2 hover:underline"
            >
              Go to Shows
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-sm text-stone-600">
              {WORKFLOW_OWNER_USING_STRATEGY_PREFIX}{" "}
              <span className="font-medium text-stone-900">
                {strategyDisplayLabel(payout.strategyType)}
              </span>{" "}
              {WORKFLOW_OWNER_USING_STRATEGY_SUFFIX}
            </p>
            <p className="text-sm text-stone-600">
              {WORKFLOW_BH_EXECUTION_TRACKING_INTRO}
            </p>

            <PeriodPlanWaterfall payoutDetail={payout} />

            <div className="overflow-x-auto rounded-md border border-stone-200/90">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-stone-200/90 bg-stone-50/60">
                  <tr>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} font-semibold text-stone-700`}
                    >
                      <span className="sr-only">Category</span>
                    </th>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} text-xs font-semibold uppercase tracking-wider text-stone-500`}
                    >
                      {WORKFLOW_BH_COL_TARGET}
                    </th>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} text-xs font-semibold uppercase tracking-wider text-stone-500`}
                    >
                      {WORKFLOW_BH_COL_RECORDED}
                    </th>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} text-xs font-semibold uppercase tracking-wider text-stone-500`}
                    >
                      {WORKFLOW_BH_COL_REMAINING}
                    </th>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} text-xs font-semibold uppercase tracking-wider text-stone-500`}
                    >
                      {WORKFLOW_BH_COL_STATUS}
                    </th>
                    <th
                      scope="col"
                      className={`${workspaceTableHeaderCellPadding} text-xs font-semibold uppercase tracking-wider text-stone-500`}
                    >
                      {WORKFLOW_BH_COL_ACTION}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-stone-100 last:border-b-0 ${
                        row.emphasize
                          ? "bg-stone-50/80 ring-1 ring-inset ring-stone-200/70"
                          : ""
                      }`}
                    >
                      <th
                        scope="row"
                        className={`${workspaceTableBodyCellPadding} font-semibold text-stone-900`}
                      >
                        {row.label}
                      </th>
                      <td
                        className={`${workspaceTableBodyCellPadding} font-medium text-stone-800 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(row.target)}
                      </td>
                      <td
                        className={`${workspaceTableBodyCellPadding} font-medium text-stone-800 ${workspaceMoneyTabular}`}
                      >
                        {row.recordedHref ? (
                          <Link
                            href={row.recordedHref}
                            className="underline-offset-2 hover:text-stone-900 hover:underline"
                          >
                            {formatCurrency(row.recorded)}
                          </Link>
                        ) : (
                          formatCurrency(row.recorded)
                        )}
                        {row.recorded > 0 && row.recordedHref ? (
                          <span
                            className={`mt-1 block ${workspaceTableCellMeta}`}
                          >
                            <Link
                              href={row.recordedHref}
                              className="font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                            >
                              {WORKFLOW_BH_VIEW_LEDGER_ROW}
                            </Link>
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`${workspaceTableBodyCellPadding} font-semibold text-stone-900 ${workspaceMoneyTabular}`}
                      >
                        {formatCurrency(row.remaining)}
                      </td>
                      <td
                        className={`${workspaceTableBodyCellPadding} text-sm font-medium ${statusToneClass(row.status)}`}
                      >
                        {row.statusLabel}
                      </td>
                      <td className={workspaceTableBodyCellPadding}>
                        <div className="flex min-w-[10rem] flex-col gap-2">
                          {row.action}
                          {row.historyHref ? (
                            <Link
                              href={row.historyHref}
                              className="text-xs font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                            >
                              {row.id === "owner"
                                ? WORKFLOW_BH_VIEW_PAYOUT_HISTORY
                                : WORKFLOW_BH_VIEW_SET_ASIDE_ENTRIES}
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allocations ? (
              <div
                id="execution-set-aside-entries"
                className="scroll-mt-24 border-t border-stone-100 pt-4"
              >
                <p className="mb-2 text-xs text-stone-500">
                  {WORKFLOW_BH_SET_ASIDE_ENTRIES_VOID_HINT}
                </p>
                <SetAsideEntriesPanel
                  entries={allocations.entries}
                  onChanged={() => void load()}
                />
              </div>
            ) : null}
          </>
        )}
      </WorkspaceCardBody>

      <WorkspaceConfirmDialog
        open={voidOwnerOpen}
        onOpenChange={setVoidOwnerOpen}
        title={WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_TITLE}
        description={WORKFLOW_BH_VOID_OWNER_PAYOUT_DIALOG_DESC}
        confirmLabel={WORKFLOW_BH_VOID_OWNER_PAYOUT_CONFIRM}
        onConfirm={confirmVoidOwner}
        tone="stone"
        icon="↺"
      />
    </WorkspaceCard>
  );
}
