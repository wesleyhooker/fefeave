"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceActionSecondarySm,
  workspaceFormLabel,
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyTabular,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { LEDGER_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WORKFLOW_BH_CASH_POSITION_HEADING,
  WORKFLOW_BH_ESTIMATED_CASH_EXPLAINER_TITLE,
  WORKFLOW_BH_ESTIMATED_CASH_LABEL,
  WORKFLOW_BH_INFLOWS_LABEL,
  WORKFLOW_BH_LEDGER_INFLOWS_LINK,
  WORKFLOW_BH_LEDGER_OUTFLOWS_LINK,
  WORKFLOW_BH_OUTFLOWS_LABEL,
  WORKFLOW_BH_SNAPSHOT_ANCHOR_LABEL,
  WORKFLOW_BH_SNAPSHOT_START_LABEL,
  WORKFLOW_BH_SNAPSHOT_UNAVAILABLE,
  WORKFLOW_BH_UPDATE_SNAPSHOT,
  WORKFLOW_BH_VIEW_LEDGER,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  createCashSnapshot,
  fetchLatestCashSnapshot,
} from "@/src/lib/api/cash-snapshots";
import {
  fetchFinancialRecommendations,
  type FinancialRecommendationsDTO,
  type RecommendationConfidence,
} from "@/src/lib/api/financial-recommendations";

function toNum(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function confidenceLabel(confidence: RecommendationConfidence): string {
  if (confidence === "HIGH") return "High confidence";
  if (confidence === "MEDIUM") return "Medium confidence";
  if (confidence === "LOW") return "Low confidence";
  return "Unavailable";
}

export function CashPositionSection({
  reloadToken,
  onSnapshotSaved,
}: {
  reloadToken: number;
  onSnapshotSaved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<FinancialRecommendationsDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [snapshotAmount, setSnapshotAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recommendations, latest] = await Promise.all([
        fetchFinancialRecommendations(),
        fetchLatestCashSnapshot(),
      ]);
      setRec(recommendations);
      if (latest?.snapshot_date) {
        setSnapshotDate(latest.snapshot_date.slice(0, 10));
      }
      if (recommendations.available && recommendations.current_cash != null) {
        setSnapshotAmount(String(toNum(recommendations.current_cash)));
      } else if (latest?.amount) {
        setSnapshotAmount(String(toNum(latest.amount)));
      }
    } catch (e) {
      setRec(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  async function handleSaveSnapshot(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amount = Number(snapshotAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setSubmitError("Enter a valid cash amount.");
      return;
    }
    setSubmitting(true);
    try {
      await createCashSnapshot({
        snapshot_date: snapshotDate,
        amount,
        source: "MANUAL",
        notes: "Reconciled from Business Health",
      });
      setShowForm(false);
      onSnapshotSaved?.();
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const available = rec?.available === true;

  return (
    <WorkspaceCard
      id="cash-position"
      aria-label={WORKFLOW_BH_CASH_POSITION_HEADING}
    >
      <WorkspaceCardHeader
        toolbar
        title={WORKFLOW_BH_CASH_POSITION_HEADING}
        titleClassName="text-lg font-semibold text-stone-900"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={workspaceActionSecondarySm}
              onClick={() => setShowForm((v) => !v)}
            >
              {WORKFLOW_BH_UPDATE_SNAPSHOT}
            </button>
            <Link href={LEDGER_HREF} className={workspaceActionSecondarySm}>
              {WORKFLOW_BH_VIEW_LEDGER}
            </Link>
          </div>
        }
      />
      <WorkspaceCardBody className="space-y-4">
        {loading ? (
          <div
            className="h-20 animate-pulse rounded-md bg-stone-100/80"
            aria-hidden
          />
        ) : error ? (
          <WorkspaceInlineError
            title="Could not load cash position"
            message={error}
            onRetry={() => void load()}
          />
        ) : !available ? (
          <p className="text-sm text-stone-600">
            {WORKFLOW_BH_SNAPSHOT_UNAVAILABLE}
          </p>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {WORKFLOW_BH_ESTIMATED_CASH_LABEL}
              </p>
              <p
                className={`mt-1 text-3xl font-semibold tracking-tight sm:text-4xl ${workspaceListPrimaryMoneyAmountClass(
                  toNum(rec.current_cash),
                )} ${workspaceMoneyTabular}`}
              >
                {formatCurrency(toNum(rec.current_cash))}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {confidenceLabel(rec.confidence)}
                {rec.freshness_reminder ? ` · ${rec.freshness_reminder}` : ""}
              </p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">
                  {WORKFLOW_BH_SNAPSHOT_ANCHOR_LABEL}
                </dt>
                <dd className="font-medium text-stone-900">
                  {rec.snapshot_date
                    ? `${formatCurrency(toNum(rec.snapshot_amount))} on ${formatDate(rec.snapshot_date)}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">{WORKFLOW_BH_INFLOWS_LABEL}</dt>
                <dd
                  className={`font-medium tabular-nums text-stone-900 ${workspaceMoneyTabular}`}
                >
                  {formatCurrency(toNum(rec.total_inflows_since_snapshot))}
                </dd>
                <dd className="mt-1">
                  <Link
                    href={LEDGER_HREF}
                    className="text-xs font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                  >
                    {WORKFLOW_BH_LEDGER_INFLOWS_LINK}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">{WORKFLOW_BH_OUTFLOWS_LABEL}</dt>
                <dd
                  className={`font-medium tabular-nums text-stone-900 ${workspaceMoneyTabular}`}
                >
                  {formatCurrency(toNum(rec.total_outflows_since_snapshot))}
                </dd>
                <dd className="mt-1">
                  <Link
                    href={`${LEDGER_HREF}?type=payment`}
                    className="text-xs font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
                  >
                    {WORKFLOW_BH_LEDGER_OUTFLOWS_LINK}
                  </Link>
                </dd>
              </div>
            </dl>

            <details className="group rounded-md border border-stone-200/80 bg-stone-50/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50/80 [&::-webkit-details-marker]:hidden">
                <span>{WORKFLOW_BH_ESTIMATED_CASH_EXPLAINER_TITLE}</span>
                <ChevronDownIcon
                  className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="space-y-2 border-t border-stone-200/80 px-3 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-stone-600">
                    {WORKFLOW_BH_SNAPSHOT_START_LABEL}
                  </span>
                  <span
                    className={`font-semibold tabular-nums text-stone-900 ${workspaceMoneyTabular}`}
                  >
                    {formatCurrency(toNum(rec.snapshot_amount))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-stone-600">
                    + {WORKFLOW_BH_INFLOWS_LABEL}
                  </span>
                  <span
                    className={`font-semibold tabular-nums text-stone-800 ${workspaceMoneyTabular}`}
                  >
                    {formatCurrency(toNum(rec.total_inflows_since_snapshot))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-stone-600">
                    − {WORKFLOW_BH_OUTFLOWS_LABEL}
                  </span>
                  <span
                    className={`font-semibold tabular-nums text-stone-500 ${workspaceMoneyTabular}`}
                  >
                    {formatCurrency(toNum(rec.total_outflows_since_snapshot))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-stone-200/70 pt-2">
                  <span className="font-medium text-stone-700">
                    = {WORKFLOW_BH_ESTIMATED_CASH_LABEL}
                  </span>
                  <span
                    className={`font-semibold tabular-nums text-stone-900 ${workspaceMoneyTabular}`}
                  >
                    {formatCurrency(toNum(rec.current_cash))}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-stone-500">
                  Inflows are mainly completed show payouts. Outflows include
                  vendor payments, inventory purchases, expenses, and owner
                  payouts recorded after the snapshot date.
                </p>
              </div>
            </details>
          </>
        )}

        {showForm ? (
          <form
            onSubmit={(e) => void handleSaveSnapshot(e)}
            className="rounded-lg border border-stone-200/90 bg-stone-50/60 p-4 space-y-3"
          >
            <div>
              <label className={workspaceFormLabel} htmlFor="bh-snapshot-date">
                Snapshot date
              </label>
              <input
                id="bh-snapshot-date"
                type="date"
                className={`${workspaceTextInput} mt-1 w-full max-w-xs`}
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className={workspaceFormLabel}
                htmlFor="bh-snapshot-amount"
              >
                Cash on hand
              </label>
              <input
                id="bh-snapshot-amount"
                type="number"
                min={0}
                step="0.01"
                className={`${workspaceTextInput} mt-1 w-full max-w-xs`}
                value={snapshotAmount}
                onChange={(e) => setSnapshotAmount(e.target.value)}
                required
              />
            </div>
            {submitError ? (
              <p className="text-sm text-red-700">{submitError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className={workspaceActionSecondarySm}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save snapshot"}
              </button>
              <button
                type="button"
                className={workspaceActionSecondarySm}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </WorkspaceCardBody>
    </WorkspaceCard>
  );
}
