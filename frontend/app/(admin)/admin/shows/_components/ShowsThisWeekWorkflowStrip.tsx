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
      <div className="border-t border-gray-200/95 bg-gray-50/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 sm:gap-x-2.5">
            <span className="text-xs font-medium text-gray-500">
              This week payout
            </span>
            <span className="text-xl font-semibold tabular-nums tracking-tight text-gray-900">
              {formatCurrency(completedWeekProfitForSnapshot)}
            </span>
          </div>

          {paid ? (
            <div className="ml-auto flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <p className="m-0 text-right">
                <span className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-sm font-medium text-emerald-800">
                  <CheckCircleIcon
                    className={`${workspaceActionIconSm} shrink-0 text-emerald-700/90`}
                    aria-hidden
                  />
                  <span>Paid</span>
                  {paidAtLabel ? (
                    <>
                      <span className="select-none font-normal text-gray-300">
                        ·
                      </span>
                      <span className="font-normal tabular-nums text-gray-500">
                        {paidAtLabel}
                      </span>
                    </>
                  ) : null}
                </span>
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
                  Mark as paid
                </WorkspaceActionLabel>
              </button>
            </div>
          )}
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
