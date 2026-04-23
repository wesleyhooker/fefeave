"use client";

import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import {
  workspaceActionIconSm,
  workspaceActionPositiveOutlineSm,
  workspaceActionSecondarySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  clearSelfPay,
  loadSelfPay,
  saveSelfPay,
  type SelfPayStored,
} from "@/app/(admin)/admin/dashboard/selfPayStorage";
import { workspaceThisWeekWorkflowFooter } from "@/app/(admin)/admin/_lib/workspaceThisWeekSurface";
import {
  WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_DESCRIPTION,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE,
  WORKFLOW_SELF_PAY_MARKED_PAID_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_DIALOG_DESCRIPTION,
  WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

export function ShowsThisWeekWorkflowStrip({
  weekStartStr,
  completedWeekProfitForSnapshot,
  showWeekProfitFigure,
}: {
  weekStartStr: string;
  /** Sum of estimated profit for COMPLETED shows this week (same basis as Dashboard self-pay snapshot). */
  completedWeekProfitForSnapshot: number;
  /** When false, omit the week profit figure (no completed shows — no placeholder). */
  showWeekProfitFigure: boolean;
}) {
  const [selfPay, setSelfPay] = useState<SelfPayStored | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);

  useEffect(() => {
    const read = () => setSelfPay(loadSelfPay(weekStartStr));
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key != null && e.key.endsWith(weekStartStr)) read();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", read);
    };
  }, [weekStartStr]);

  const paid = selfPay?.paid === true;

  const handleMarkDone = () => {
    const next: SelfPayStored = {
      paid: true,
      paidAt: new Date().toISOString(),
      profitSnapshot: completedWeekProfitForSnapshot,
    };
    saveSelfPay(weekStartStr, next);
    setSelfPay(next);
    setMarkPaidOpen(false);
  };

  const handleMarkUndone = () => {
    clearSelfPay(weekStartStr);
    setSelfPay({ paid: false });
    setMarkUnpaidOpen(false);
  };

  const paidAtLabel =
    selfPay?.paidAt != null
      ? new Date(selfPay.paidAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  return (
    <>
      <div
        className={`px-4 py-4 sm:px-5 sm:py-4 ${workspaceThisWeekWorkflowFooter}`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          {showWeekProfitFigure ? (
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 sm:gap-x-2.5">
              <span className="text-xl font-semibold tabular-nums tracking-tight text-gray-900">
                {formatCurrency(completedWeekProfitForSnapshot)}
              </span>
            </div>
          ) : null}

          {paid ? (
            <div
              className={`flex min-w-0 shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3 ${showWeekProfitFigure ? "ml-auto" : "ml-auto w-full sm:w-auto"}`}
            >
              <p className="m-0 flex flex-col items-end gap-0.5 text-right sm:flex-row sm:items-center sm:gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-emerald-800">
                  <CheckCircleIcon
                    className={`${workspaceActionIconSm} shrink-0 text-emerald-700/90`}
                    aria-hidden
                  />
                  <span>{WORKFLOW_SELF_PAY_MARKED_PAID_LABEL}</span>
                </span>
                {paidAtLabel ? (
                  <span className="text-[11px] font-medium tabular-nums text-emerald-800/75">
                    Confirmed {paidAtLabel}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={() => setMarkUnpaidOpen(true)}
                className={`${workspaceActionSecondarySm} shrink-0 !gap-1 !px-2 !py-0.5`}
              >
                <WorkspaceActionLabel
                  icon={
                    <ArrowUturnLeftIcon className={workspaceActionIconSm} />
                  }
                >
                  Mark as unpaid
                </WorkspaceActionLabel>
              </button>
            </div>
          ) : (
            <div className="ml-auto flex shrink-0">
              <button
                type="button"
                onClick={() => setMarkPaidOpen(true)}
                className={workspaceActionPositiveOutlineSm}
              >
                <WorkspaceActionLabel
                  icon={<CheckCircleIcon className={workspaceActionIconSm} />}
                >
                  {WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL}
                </WorkspaceActionLabel>
              </button>
            </div>
          )}
        </div>
      </div>

      <WorkspaceConfirmDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        title={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE}
        description={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_DESCRIPTION}
        confirmLabel={WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL}
        onConfirm={handleMarkDone}
        tone="rose"
        icon="$"
      />
      <WorkspaceConfirmDialog
        open={markUnpaidOpen}
        onOpenChange={setMarkUnpaidOpen}
        title={WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE}
        description={WORKFLOW_SELF_PAY_REOPEN_DIALOG_DESCRIPTION}
        confirmLabel={WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL}
        onConfirm={handleMarkUndone}
        tone="stone"
        icon="↺"
      />
    </>
  );
}
