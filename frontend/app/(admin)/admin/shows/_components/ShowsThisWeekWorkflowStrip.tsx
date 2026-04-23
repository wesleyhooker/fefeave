"use client";

import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import {
  workspaceActionIconSm,
  workspaceActionSecondaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  clearSelfPay,
  loadSelfPay,
  saveSelfPay,
  type SelfPayStored,
} from "@/app/(admin)/admin/dashboard/selfPayStorage";
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
}: {
  weekStartStr: string;
  /** Sum of estimated profit for COMPLETED shows this week (same basis as Dashboard self-pay snapshot). */
  completedWeekProfitForSnapshot: number;
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
      <div className="w-full rounded-lg border border-stone-200/90 bg-white/85 px-3 py-2.5 sm:min-w-[13.5rem] sm:w-auto sm:px-3.5 sm:py-3">
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Status
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${paid ? "text-emerald-800" : "text-stone-700"}`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${paid ? "bg-emerald-600/80" : "bg-stone-400/90"}`}
              aria-hidden
            />
            {paid ? WORKFLOW_SELF_PAY_MARKED_PAID_LABEL : "Unpaid"}
          </span>
          {paidAtLabel && paid ? (
            <p className="text-[11px] font-medium tabular-nums text-emerald-800/75 sm:text-right">
              Confirmed {paidAtLabel}
            </p>
          ) : null}

          {paid ? (
            <button
              type="button"
              onClick={() => setMarkUnpaidOpen(true)}
              className={`${workspaceActionSecondaryMd} w-full justify-center !py-1.5 sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<ArrowUturnLeftIcon className={workspaceActionIconSm} />}
              >
                Mark as unpaid
              </WorkspaceActionLabel>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMarkPaidOpen(true)}
              className={`${workspaceActionSecondaryMd} w-full justify-center !py-1.5 sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<CheckCircleIcon className={workspaceActionIconSm} />}
              >
                Mark week paid
              </WorkspaceActionLabel>
            </button>
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
