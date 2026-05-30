"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import {
  AdminSummaryStatGrid,
  type AdminSummaryStatItem,
} from "@/app/(admin)/admin/_components/AdminSummaryStatGrid";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceActionCompleteMd,
  workspaceCard,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";
import { fetchInventoryInvested } from "@/src/lib/api/inventory-purchases";
import { fetchBusinessExpensesTotal } from "@/src/lib/api/business-expenses";
import {
  fetchFinancialStrategy,
  type FinancialStrategyDTO,
} from "@/src/lib/api/financial-strategy";
import {
  fetchLatestCashSnapshot,
  createCashSnapshot,
  type CashSnapshotDTO,
} from "@/src/lib/api/cash-snapshots";
import {
  fetchFinancialRecommendations,
  type FinancialRecommendationsDTO,
  type RecommendationConfidence,
} from "@/src/lib/api/financial-recommendations";
import {
  STRATEGY_OPTIONS,
  bpsToPercent,
  type StrategyType,
} from "@/src/lib/constants/financial-strategy";

function confidenceLabel(confidence: RecommendationConfidence): string {
  switch (confidence) {
    case "HIGH":
      return "High confidence";
    case "MEDIUM":
      return "Medium confidence";
    case "LOW":
      return "Low confidence";
    default:
      return "Unavailable";
  }
}

function confidenceBadgeClass(confidence: RecommendationConfidence): string {
  switch (confidence) {
    case "HIGH":
      return "bg-emerald-100 text-emerald-800";
    case "MEDIUM":
      return "bg-amber-100 text-amber-800";
    case "LOW":
      return "bg-orange-100 text-orange-900";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

/** Recent activity window used by the snapshot spend cards. Documented in copy. */
const SNAPSHOT_WINDOW_DAYS = 30;
const SNAPSHOT_WINDOW_LABEL = "Last 30 days";

function todayIsoDate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function strategyLabel(type: StrategyType): string {
  return STRATEGY_OPTIONS.find((o) => o.type === type)?.label ?? "Custom";
}

function formatPercent(bps: number): string {
  return `${bpsToPercent(bps)}%`;
}

type OverviewData = {
  outstandingBalance: number;
  inventoryTotal: number;
  expensesTotal: number;
  strategy: FinancialStrategyDTO;
  cashSnapshot: CashSnapshotDTO | null;
  recommendations: FinancialRecommendationsDTO;
};

export default function AdminFinancialsOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<OverviewData | null>(null);

  const [showCashForm, setShowCashForm] = useState(false);
  const [cashSnapshotDate, setCashSnapshotDate] = useState("");
  const [cashSnapshotAmount, setCashSnapshotAmount] = useState("");
  const [cashSnapshotNotes, setCashSnapshotNotes] = useState("");
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashSubmitError, setCashSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchWholesalerBalances(),
      fetchInventoryInvested(SNAPSHOT_WINDOW_DAYS),
      fetchBusinessExpensesTotal(SNAPSHOT_WINDOW_DAYS),
      fetchFinancialStrategy(),
      fetchLatestCashSnapshot(),
      fetchFinancialRecommendations(),
    ])
      .then(
        ([
          balances,
          inventory,
          expenses,
          strategy,
          cashSnapshot,
          recommendations,
        ]) => {
          if (cancelled) return;
          const outstandingBalance = balances.reduce(
            (sum, r) => sum + parseAmount(r.balance_owed),
            0,
          );
          setData({
            outstandingBalance,
            inventoryTotal: parseAmount(inventory.total),
            expensesTotal: parseAmount(expenses.total),
            strategy,
            cashSnapshot,
            recommendations,
          });
        },
      )
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function openCashForm(snapshot?: CashSnapshotDTO | null) {
    setCashSubmitError(null);
    setCashSnapshotDate(todayIsoDate());
    setCashSnapshotAmount(snapshot ? String(parseAmount(snapshot.amount)) : "");
    setCashSnapshotNotes(snapshot?.notes ?? "");
    setShowCashForm(true);
  }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCashSubmitError(null);
    const amt = cashSnapshotAmount === "" ? NaN : Number(cashSnapshotAmount);
    if (!cashSnapshotDate.trim()) {
      setCashSubmitError("Date is required.");
      return;
    }
    if (Number.isNaN(amt) || amt < 0) {
      setCashSubmitError("Amount must be zero or greater.");
      return;
    }
    setCashSubmitting(true);
    try {
      await createCashSnapshot({
        snapshot_date: cashSnapshotDate.trim(),
        amount: amt,
        notes: cashSnapshotNotes.trim() || undefined,
      });
      setShowCashForm(false);
      setCashSnapshotNotes("");
      setReloadToken((t) => t + 1);
    } catch (err) {
      setCashSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setCashSubmitting(false);
    }
  }

  const snapshotItems = useMemo<AdminSummaryStatItem[]>(() => {
    if (!data) return [];
    return [
      {
        id: "outstanding",
        surface: "owed",
        label: "Owed to wholesalers",
        value: (
          <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
            {formatCurrency(data.outstandingBalance)}
          </p>
        ),
        meta: "Current unpaid wholesaler balances.",
      },
      {
        id: "inventory",
        surface: "neutral",
        label: "Inventory spend",
        value: (
          <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
            {formatCurrency(data.inventoryTotal)}
          </p>
        ),
        meta: SNAPSHOT_WINDOW_LABEL,
      },
      {
        id: "expenses",
        surface: "neutral",
        label: "Business expenses",
        value: (
          <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
            {formatCurrency(data.expensesTotal)}
          </p>
        ),
        meta: SNAPSHOT_WINDOW_LABEL,
      },
      {
        id: "strategy",
        surface: "completed",
        label: "Strategy",
        value: (
          <p className="text-xl font-semibold text-stone-900 sm:text-2xl">
            {strategyLabel(data.strategy.strategy_type)}
          </p>
        ),
        meta: data.strategy.is_default
          ? "Default — not set yet"
          : "Active strategy",
      },
    ];
  }, [data]);

  return (
    <AdminWorkspacePageLayout
      intro={
        <AdminWorkspacePageIntro
          title="Overview"
          subtitle="A plain-language read on the business with deterministic recommendations based on your strategy and latest cash snapshot."
        />
      }
    >
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : error ? (
        <WorkspaceInlineError
          title="Could not load the Financials overview."
          message={error}
          onRetry={() => setReloadToken((t) => t + 1)}
        />
      ) : data ? (
        <div className="space-y-8">
          {/* Section 1 — Financial Snapshot */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Financial snapshot
              </h2>
              <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                Spend totals cover the {SNAPSHOT_WINDOW_LABEL.toLowerCase()} of
                recorded activity. Values are estimates based on what has been
                entered, not a live bank balance.
              </p>
            </div>
            <AdminSummaryStatGrid
              items={snapshotItems}
              aria-label="Financial snapshot"
            />
          </section>

          {/* Cash Position */}
          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Cash position
            </h2>
            {data.cashSnapshot ? (
              <>
                <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                  Your most recent business-wide cash snapshot. Recommendations
                  below use this amount as current cash.
                </p>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-gray-500">Snapshot amount</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                      {formatCurrency(parseAmount(data.cashSnapshot.amount))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Last reconciled</dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">
                      {formatDate(data.cashSnapshot.snapshot_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Source</dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">
                      Manual
                    </dd>
                  </div>
                </dl>
                {data.cashSnapshot.notes ? (
                  <p className={`mt-3 text-sm ${workspaceFormLabelSecondary}`}>
                    {data.cashSnapshot.notes}
                  </p>
                ) : null}
                {!showCashForm ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => openCashForm(data.cashSnapshot)}
                      className={workspaceActionCompleteMd}
                    >
                      Reconcile cash snapshot
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                  Add a cash snapshot to generate recommendations.
                </p>
                {!showCashForm ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => openCashForm()}
                      className={workspaceActionCompleteMd}
                    >
                      Add cash snapshot
                    </button>
                  </div>
                ) : null}
              </>
            )}
            {showCashForm ? (
              <form
                onSubmit={handleCashSubmit}
                className="mt-4 space-y-4 border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:max-w-xl">
                  <label className="block min-w-0">
                    <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                      Snapshot date
                    </span>
                    <input
                      type="date"
                      value={cashSnapshotDate}
                      onChange={(e) => setCashSnapshotDate(e.target.value)}
                      className={`w-full min-w-0 max-w-[12rem] ${workspaceDateInput}`}
                      required
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                      Cash on hand ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashSnapshotAmount}
                      onChange={(e) => setCashSnapshotAmount(e.target.value)}
                      className={`w-full min-w-0 max-w-[12rem] ${workspaceTextInput}`}
                      inputMode="decimal"
                      required
                    />
                    <p
                      className={`mt-1.5 text-xs ${workspaceFormLabelSecondary}`}
                    >
                      One business-wide total — not per account.
                    </p>
                  </label>
                  <label className="block min-w-0">
                    <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                      Notes (optional)
                    </span>
                    <input
                      type="text"
                      value={cashSnapshotNotes}
                      onChange={(e) => setCashSnapshotNotes(e.target.value)}
                      className={`w-full min-w-0 ${workspaceTextInput}`}
                      maxLength={2000}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={cashSubmitting}
                    className={`${workspaceActionCompleteMd} disabled:opacity-50`}
                  >
                    {cashSubmitting ? "Saving…" : "Save snapshot"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCashForm(false);
                      setCashSubmitError(null);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                {cashSubmitError ? (
                  <p className="text-sm text-amber-700" role="alert">
                    {cashSubmitError}
                  </p>
                ) : null}
              </form>
            ) : null}
          </section>

          {/* Section 2 — Strategy Preview */}
          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Strategy preview
            </h2>
            <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
              Your current targets —{" "}
              {strategyLabel(data.strategy.strategy_type)}. These describe how
              available cash should be split.
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <dt className="text-sm text-gray-500">Tax Reserve Target</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                  {formatPercent(data.strategy.tax_reserve_bps)}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <dt className="text-sm text-gray-500">Reinvestment Target</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                  {formatPercent(data.strategy.reinvestment_bps)}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <dt className="text-sm text-gray-500">Cash Buffer Target</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                  {formatCurrency(
                    parseAmount(data.strategy.cash_buffer_amount),
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Recommendation Summary */}
          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Recommendation summary
              </h2>
              {data.recommendations.available ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${confidenceBadgeClass(data.recommendations.confidence)}`}
                >
                  {confidenceLabel(data.recommendations.confidence)}
                </span>
              ) : null}
            </div>
            {!data.recommendations.available ? (
              <p className={`mt-3 text-sm ${workspaceFormLabelSecondary}`}>
                Add a cash snapshot in Cash Position above to generate
                recommendations.
              </p>
            ) : (
              <>
                <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                  Based on your current strategy and latest cash snapshot.
                  Recommendations are guidance only and do not move money.
                </p>
                {data.recommendations.snapshot_date ? (
                  <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                    Last reconciled{" "}
                    {formatDate(data.recommendations.snapshot_date)}.
                    {data.recommendations.confidence === "LOW"
                      ? " This snapshot is getting stale — reconcile when you can."
                      : null}
                    {data.recommendations.confidence === "MEDIUM"
                      ? " Consider reconciling soon for fresher guidance."
                      : null}
                  </p>
                ) : null}
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-sm text-gray-500">Current cash</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                      {formatCurrency(
                        parseAmount(data.recommendations.current_cash ?? "0"),
                      )}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-sm text-gray-500">
                      Tax reserve recommendation
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.tax_reserve_recommendation ??
                            "0",
                        ),
                      )}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      {formatPercent(data.recommendations.tax_reserve_bps)} of
                      current cash
                    </dd>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-sm text-gray-500">
                      Cash buffer target
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.cash_buffer_target ?? "0",
                        ),
                      )}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-sm text-gray-500">
                      Reinvestment recommendation
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.reinvestment_recommendation ??
                            "0",
                        ),
                      )}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      {formatPercent(data.recommendations.reinvestment_bps)} of
                      available after protection
                    </dd>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:col-span-2 xl:col-span-2">
                    <dt className="text-sm font-medium text-emerald-900">
                      Safe owner draw
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tabular-nums text-emerald-950">
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.safe_owner_draw ?? "0",
                        ),
                      )}
                    </dd>
                    <dd className="mt-1 text-sm text-emerald-900/80">
                      How much you could safely take home right now after tax
                      reserve, cash buffer, and reinvestment targets.
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </section>

          {/* What's Missing */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-900">
              What&apos;s missing
            </h2>
            <p className="mt-1 text-sm text-amber-900/90">
              Recommendations use your snapshot amount directly. These items can
              improve accuracy over time:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
              {!data.cashSnapshot ? (
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 text-amber-700">
                    •
                  </span>
                  <span>
                    <span className="font-medium">Cash snapshot</span> — record
                    actual cash on hand to unlock recommendations.
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 text-amber-700">
                    •
                  </span>
                  <span>
                    <span className="font-medium">Fresh reconciliation</span> —
                    update your snapshot when cash changes so guidance stays
                    current.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 text-amber-700">
                  •
                </span>
                <span>
                  <span className="font-medium">Complete records</span> — keep
                  payments, expenses, inventory, and owner activity up to date
                  for future event-adjusted cash estimates.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-amber-900/80">
              Recommendations are guidance only. They never move money or create
              owner draws.
            </p>
          </section>
        </div>
      ) : null}
    </AdminWorkspacePageLayout>
  );
}
