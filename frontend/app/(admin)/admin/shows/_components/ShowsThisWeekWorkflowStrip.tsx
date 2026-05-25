"use client";

import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import {
  workspaceActionIconSm,
  workspaceActionPositiveCompleteSm,
  workspaceListPrimaryMoneyAmountClass,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  deriveOwnerWeeklyPayoutUiState,
  loadSelfPayAndPayoutServer,
  loadWeeklyPayoutStateServer,
  markSelfPayPaidServer,
  markSelfPayUnpaidServer,
  type OwnerWeeklyPayoutState,
  type SelfPayStored,
} from "@/app/(admin)/admin/dashboard/selfPayStorage";
import {
  WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE,
  WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL,
  WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

export function ShowsThisWeekWorkflowStrip({
  weekStartStr,
  weekEndStr,
  completedWeekProfitForSnapshot,
}: {
  weekStartStr: string;
  weekEndStr: string;
  /** Sum of estimated profit for COMPLETED shows this week (same basis as Dashboard self-pay snapshot). */
  completedWeekProfitForSnapshot: number;
}) {
  const [selfPay, setSelfPay] = useState<SelfPayStored | null>(null);
  const [weeklyPayoutState, setWeeklyPayoutState] =
    useState<OwnerWeeklyPayoutState>({
      amount: 0,
      canRecordPayout: false,
    });
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void loadSelfPayAndPayoutServer({ weekStartYmd: weekStartStr })
        .then(({ selfPay: selfPayState, payout }) => {
          if (!cancelled) {
            setSelfPay(selfPayState);
            setWeeklyPayoutState(payout);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSelfPay({ paid: false });
            setWeeklyPayoutState({ amount: 0, canRecordPayout: false });
          }
        });
    };
    refresh();
    const onFocus = () => {
      refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [weekStartStr]);

  const payoutUiState = deriveOwnerWeeklyPayoutUiState({
    selfPay,
    payoutAmount: weeklyPayoutState.amount,
  });
  const paid = payoutUiState.isPaid;
  const markRangeLabel = `${formatDate(weekStartStr)} – ${formatDate(weekEndStr)}`;
  const markPaidDialogDescription = `Week ${markRangeLabel} · ${formatCurrency(
    weeklyPayoutState.amount,
  )}. This records or updates the owner payout in Owner activity.`;
  const markUnpaidDialogDescription = `Week ${markRangeLabel}. This voids the owner payout, and the row stays visible as voided in Owner activity.`;

  const handleMarkDone = async () => {
    if (isMutating) return;
    const next: SelfPayStored = {
      paid: true,
      paidAt: new Date().toISOString(),
      profitSnapshot: completedWeekProfitForSnapshot,
    };
    setIsMutating(true);
    setSelfPay(next);
    setMarkPaidOpen(false);
    try {
      const serverState = await markSelfPayPaidServer({
        weekStartYmd: weekStartStr,
        weekEndYmd: weekEndStr,
      });
      setSelfPay(serverState);
      const payout = await loadWeeklyPayoutStateServer(weekStartStr);
      setWeeklyPayoutState(payout);
    } catch {
      try {
        const synced = await loadSelfPayAndPayoutServer({
          weekStartYmd: weekStartStr,
        });
        setSelfPay(synced.selfPay);
        setWeeklyPayoutState(synced.payout);
      } catch {
        setSelfPay({ paid: false });
        setWeeklyPayoutState({ amount: 0, canRecordPayout: false });
      }
      throw new Error("Unable to record owner payout");
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkUndone = async () => {
    if (isMutating) return;
    setIsMutating(true);
    setSelfPay({ paid: false });
    setMarkUnpaidOpen(false);
    try {
      const serverState = await markSelfPayUnpaidServer(weekStartStr);
      setSelfPay(serverState);
      const payout = await loadWeeklyPayoutStateServer(weekStartStr);
      setWeeklyPayoutState(payout);
    } catch {
      try {
        const synced = await loadSelfPayAndPayoutServer({
          weekStartYmd: weekStartStr,
        });
        setSelfPay(synced.selfPay);
        setWeeklyPayoutState(synced.payout);
      } catch {
        setSelfPay({ paid: false });
        setWeeklyPayoutState({ amount: 0, canRecordPayout: false });
      }
      throw new Error("Unable to void owner payout");
    } finally {
      setIsMutating(false);
    }
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
      <div className="w-full px-1 py-1 sm:min-w-[13.5rem] sm:w-auto">
        <div className="flex flex-col items-stretch gap-2">
          <p
            className={`text-[1.35rem] leading-none tracking-tight sm:text-[1.8rem] ${workspaceListPrimaryMoneyAmountClass(
              weeklyPayoutState.amount,
            )}`}
          >
            {formatCurrency(weeklyPayoutState.amount)}
          </p>
          <p
            className={`text-sm font-medium ${paid ? "text-emerald-800" : "text-stone-700"}`}
          >
            {paid && paidAtLabel ? `Paid • ${paidAtLabel}` : "Unpaid"}
          </p>
          {paid ? (
            <button
              type="button"
              onClick={() => setMarkUnpaidOpen(true)}
              disabled={isMutating}
              className="w-fit rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100/90 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300/45 disabled:opacity-60"
              aria-label="Undo payout"
              title="Undo payout"
            >
              <ArrowUturnLeftIcon className={workspaceActionIconSm} />
            </button>
          ) : (
            <>
              {payoutUiState.canMarkPaid ? (
                <button
                  type="button"
                  onClick={() => setMarkPaidOpen(true)}
                  disabled={isMutating}
                  className={`${workspaceActionPositiveCompleteSm} w-full justify-center disabled:opacity-60 sm:w-auto`}
                >
                  <WorkspaceActionLabel
                    icon={<CheckCircleIcon className={workspaceActionIconSm} />}
                  >
                    Mark week paid
                  </WorkspaceActionLabel>
                </button>
              ) : (
                <p className="text-xs text-stone-500">No payout to mark yet</p>
              )}
            </>
          )}
        </div>
      </div>

      <WorkspaceConfirmDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        title={WORKFLOW_SELF_PAY_MARK_PAID_DIALOG_TITLE}
        description={markPaidDialogDescription}
        confirmLabel={WORKFLOW_SELF_PAY_MARK_PAID_CONFIRM_LABEL}
        onConfirm={handleMarkDone}
        tone="rose"
        icon="$"
      />
      <WorkspaceConfirmDialog
        open={markUnpaidOpen}
        onOpenChange={setMarkUnpaidOpen}
        title={WORKFLOW_SELF_PAY_REOPEN_DIALOG_TITLE}
        description={markUnpaidDialogDescription}
        confirmLabel={WORKFLOW_SELF_PAY_REOPEN_CONFIRM_LABEL}
        onConfirm={handleMarkUndone}
        tone="stone"
        icon="↺"
      />
    </>
  );
}
