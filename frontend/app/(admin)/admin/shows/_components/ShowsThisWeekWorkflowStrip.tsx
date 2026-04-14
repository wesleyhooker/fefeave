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
  workspaceActionSecondarySm,
  workspaceActionPositiveCompleteSm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  clearSelfPay,
  loadSelfPay,
  saveSelfPay,
  type SelfPayStored,
} from "@/app/(admin)/admin/dashboard/selfPayStorage";

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
      <div
        className={
          paid
            ? "border-t border-emerald-200/55 bg-emerald-50/45 px-4 py-3.5 sm:px-5"
            : "border-t border-gray-200/95 bg-white px-4 py-3.5 sm:px-5"
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">
              This week payout
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-gray-900">
              {formatCurrency(completedWeekProfitForSnapshot)}
            </p>
            {paid ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                  <CheckCircleIcon
                    className={`${workspaceActionIconSm} shrink-0 text-emerald-700`}
                  />
                  Paid
                </span>
                {paidAtLabel ? (
                  <span className="text-xs font-normal tabular-nums text-gray-500">
                    {paidAtLabel}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0">
            {paid ? (
              <button
                type="button"
                onClick={() => setMarkUnpaidOpen(true)}
                className={workspaceActionSecondarySm}
              >
                <WorkspaceActionLabel
                  icon={
                    <ArrowUturnLeftIcon className={workspaceActionIconSm} />
                  }
                >
                  Mark as unpaid
                </WorkspaceActionLabel>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMarkPaidOpen(true)}
                className={`${workspaceActionPositiveCompleteSm} sm:px-3.5 sm:py-2`}
              >
                <WorkspaceActionLabel
                  icon={<CheckCircleIcon className={workspaceActionIconSm} />}
                >
                  Mark as paid
                </WorkspaceActionLabel>
              </button>
            )}
          </div>
        </div>
      </div>

      <WorkspaceConfirmDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        title="Mark this week as paid?"
        description="You're confirming you've paid yourself for this week."
        confirmLabel="Mark as paid"
        onConfirm={handleMarkDone}
        tone="rose"
        icon="$"
      />
      <WorkspaceConfirmDialog
        open={markUnpaidOpen}
        onOpenChange={setMarkUnpaidOpen}
        title="Reopen this week payout?"
        description="This will remove the paid status so you can confirm again later."
        confirmLabel="Reopen week"
        onConfirm={handleMarkUndone}
        tone="stone"
        icon="↺"
      />
    </>
  );
}
