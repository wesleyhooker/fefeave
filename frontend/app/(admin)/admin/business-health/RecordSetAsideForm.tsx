"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WORKFLOW_BH_RECORD_SET_ASIDE_AMOUNT_LABEL,
  WORKFLOW_BH_RECORD_SET_ASIDE_NOTE_LABEL,
  WORKFLOW_BH_RECORD_SET_ASIDE_REMAINING_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionCompleteMd,
  workspaceFormLabel,
  workspaceMoneyTabular,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  recordPeriodAllocation,
  type StrategyAllocationType,
} from "@/src/lib/api/strategyAllocations";

export function RecordSetAsideForm({
  weekStartDate,
  allocationType,
  remainingAmount,
  onSuccess,
}: {
  weekStartDate: string;
  allocationType: StrategyAllocationType;
  remainingAmount: number;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultAmount = useMemo(() => {
    if (remainingAmount <= 0) return "";
    return remainingAmount.toFixed(2);
  }, [remainingAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amt = amount === "" ? NaN : Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError("Enter an amount greater than zero.");
      return;
    }
    if (remainingAmount > 0 && amt > remainingAmount + 0.001) {
      setSubmitError(
        `Amount cannot exceed ${formatCurrency(remainingAmount)} remaining.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await recordPeriodAllocation({
        weekStartDate,
        allocationType,
        amount: amt,
        note: note.trim() || undefined,
      });
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-sm text-stone-600">
        {WORKFLOW_BH_RECORD_SET_ASIDE_REMAINING_HINT}:{" "}
        <span
          className={`font-semibold text-stone-900 ${workspaceMoneyTabular}`}
        >
          {formatCurrency(remainingAmount)}
        </span>
      </p>

      <div>
        <label className={workspaceFormLabel} htmlFor="set-aside-amount">
          {WORKFLOW_BH_RECORD_SET_ASIDE_AMOUNT_LABEL}
        </label>
        <input
          id="set-aside-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          className={`${workspaceTextInput} mt-1`}
          value={amount}
          placeholder={defaultAmount || undefined}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label className={workspaceFormLabel} htmlFor="set-aside-note">
          {WORKFLOW_BH_RECORD_SET_ASIDE_NOTE_LABEL}
        </label>
        <input
          id="set-aside-note"
          type="text"
          className={`${workspaceTextInput} mt-1`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
        />
      </div>

      {submitError ? (
        <WorkspaceInlineError title="Could not record" message={submitError} />
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-60`}
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
