"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WORKFLOW_BH_RECORD_OWNER_PAYOUT_AMOUNT_LABEL,
  WORKFLOW_BH_RECORD_OWNER_PAYOUT_NOTE_LABEL,
  WORKFLOW_BH_RECORD_OWNER_PAYOUT_REMAINING_HINT,
  WORKFLOW_BH_RECORD_OWNER_PAYOUT_REVIEW_NOTE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionCompleteMd,
  workspaceFormLabel,
  workspaceMoneyTabular,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { upsertOwnerSelfPayWeek } from "@/src/lib/api/ownerSelfPay";

export function RecordOwnerPayoutForm({
  weekStartDate,
  weekEndDate,
  remainingAmount,
  onSuccess,
}: {
  weekStartDate: string;
  weekEndDate: string;
  remainingAmount: number;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (remainingAmount > 0) {
      setAmount(remainingAmount.toFixed(2));
    } else {
      setAmount("");
    }
  }, [remainingAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amt = amount === "" ? NaN : Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError("Enter an amount greater than zero.");
      return;
    }
    if (Math.abs(amt - remainingAmount) > 0.01) {
      setSubmitError(
        `Amount must match ${formatCurrency(remainingAmount)} remaining for this period.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await upsertOwnerSelfPayWeek({
        weekStartDate,
        weekEndDate,
        amount: amt,
        transactionType: "SELF_PAY",
        reference: "Week payout",
        note: note.trim() || "Week payout",
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
        {WORKFLOW_BH_RECORD_OWNER_PAYOUT_REMAINING_HINT}:{" "}
        <span
          className={`font-semibold text-stone-900 ${workspaceMoneyTabular}`}
        >
          {formatCurrency(remainingAmount)}
        </span>
      </p>
      <p className="text-xs leading-relaxed text-stone-500">
        {WORKFLOW_BH_RECORD_OWNER_PAYOUT_REVIEW_NOTE}
      </p>

      <div>
        <label className={workspaceFormLabel} htmlFor="owner-payout-amount">
          {WORKFLOW_BH_RECORD_OWNER_PAYOUT_AMOUNT_LABEL}
        </label>
        <input
          id="owner-payout-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          className={`${workspaceTextInput} mt-1`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting || remainingAmount <= 0}
          required
        />
      </div>

      <div>
        <label className={workspaceFormLabel} htmlFor="owner-payout-note">
          {WORKFLOW_BH_RECORD_OWNER_PAYOUT_NOTE_LABEL}
        </label>
        <input
          id="owner-payout-note"
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
        disabled={submitting || remainingAmount <= 0}
        className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-60`}
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
