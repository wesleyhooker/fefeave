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
import Link from "next/link";
import { FinancialsCrossLinks } from "@/app/(admin)/admin/_components/FinancialsCrossLinks";
import {
  workspaceActionCompleteMd,
  workspaceActionSecondarySm,
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

const ADVISORY_COPY =
  "Guidance only — this does not move money or create an owner draw.";

const INVENTORY_BUDGET_HELPER =
  "Inventory budget is money available to reinvest in inventory. If you do not spend it now, it stays in the business and future recommendations will update.";

const SAFE_OWNER_DRAW_HELPER =
  "Safe owner draw is the amount you could move to your personal account after protecting taxes, buffer, and inventory budget.";

type BreakdownRowProps = {
  label: string;
  amount: number;
  variant?: "base" | "subtract" | "result" | "highlight";
};

function BreakdownRow({
  label,
  amount,
  variant = "base",
}: BreakdownRowProps): React.ReactElement {
  const isSubtract = variant === "subtract";
  const isHighlight = variant === "highlight";
  const isResult = variant === "result";
  const amountClass = isHighlight
    ? "text-emerald-950 font-semibold"
    : isResult
      ? "text-gray-900 font-semibold"
      : "text-gray-900";

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 py-2.5 last:border-b-0">
      <span
        className={`min-w-0 text-sm ${isHighlight ? "font-medium text-emerald-900" : "text-gray-600"}`}
      >
        {label}
      </span>
      <span className={`shrink-0 text-sm tabular-nums ${amountClass}`}>
        {isSubtract ? "−" : ""}
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}

type AllocationCardProps = {
  label: string;
  amount: number;
  helper?: string;
  emphasis?: boolean;
};

function AllocationCard({
  label,
  amount,
  helper,
  emphasis = false,
}: AllocationCardProps): React.ReactElement {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${
        emphasis
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-gray-200 bg-white"
      }`}
    >
      <p
        className={`text-sm font-medium ${emphasis ? "text-emerald-900" : "text-gray-600"}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 tabular-nums tracking-tight ${
          emphasis
            ? "text-3xl font-semibold text-emerald-950 sm:text-4xl"
            : "text-2xl font-semibold text-gray-900 sm:text-3xl"
        }`}
      >
        {formatCurrency(amount)}
      </p>
      {helper ? (
        <p
          className={`mt-2 text-xs leading-relaxed ${
            emphasis ? "text-emerald-900/80" : "text-gray-500"
          }`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

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

  const lastReconciledDate =
    data?.cashSnapshot?.snapshot_date ?? data?.recommendations.snapshot_date;

  return (
    <AdminWorkspacePageLayout
      intro={
        <AdminWorkspacePageIntro
          title="Overview"
          subtitle="See how to allocate your business cash — taxes, buffer, inventory, and take-home — based on your strategy and estimated current cash."
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
          {/* A — Recommended Allocation Plan */}
          <section className={`p-4 sm:p-6 ${workspaceCard}`}>
            {!data.recommendations.available ? (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Recommended allocation plan
                </h2>
                <p className={`mt-2 text-base font-medium text-gray-900`}>
                  How should I use my business cash?
                </p>
                <p className={`mt-3 text-sm ${workspaceFormLabelSecondary}`}>
                  Add a cash snapshot below to see how to set aside taxes, keep
                  a buffer, budget for inventory, and what you could safely take
                  home.
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Recommended allocation plan
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${confidenceBadgeClass(data.recommendations.confidence)}`}
                  >
                    {confidenceLabel(data.recommendations.confidence)}
                  </span>
                </div>
                <p className="mt-2 text-base font-medium text-gray-900">
                  How should I use my business cash?
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Estimated current cash
                    </p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-gray-900 sm:text-4xl">
                      {formatCurrency(
                        parseAmount(data.recommendations.current_cash ?? "0"),
                      )}
                    </p>
                  </div>
                  {lastReconciledDate ? (
                    <p className={`text-sm ${workspaceFormLabelSecondary}`}>
                      Last reconciled{" "}
                      <span className="font-medium text-gray-900">
                        {formatDate(lastReconciledDate)}
                      </span>
                    </p>
                  ) : null}
                </div>
                {data.recommendations.freshness_reminder ? (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      data.recommendations.confidence === "LOW"
                        ? "border-orange-200 bg-orange-50 text-orange-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                    role="status"
                  >
                    {data.recommendations.freshness_reminder}
                  </div>
                ) : null}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AllocationCard
                    label="Set aside for taxes"
                    amount={parseAmount(
                      data.recommendations.tax_reserve_recommendation ?? "0",
                    )}
                  />
                  <AllocationCard
                    label="Keep as cash buffer"
                    amount={parseAmount(
                      data.recommendations.cash_buffer_target ?? "0",
                    )}
                  />
                  <AllocationCard
                    label="Inventory budget"
                    amount={parseAmount(
                      data.recommendations.reinvestment_recommendation ?? "0",
                    )}
                    helper={INVENTORY_BUDGET_HELPER}
                  />
                  <AllocationCard
                    label="Safe owner draw"
                    amount={parseAmount(
                      data.recommendations.safe_owner_draw ?? "0",
                    )}
                    helper={SAFE_OWNER_DRAW_HELPER}
                    emphasis
                  />
                </div>
                <p className={`mt-4 text-xs ${workspaceFormLabelSecondary}`}>
                  {ADVISORY_COPY}
                </p>
              </>
            )}
          </section>

          {/* B — Explanation / formula */}
          {data.recommendations.available ? (
            <section className={`p-4 sm:p-5 ${workspaceCard}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                How this plan is calculated
              </h2>
              <p className={`mt-2 text-sm ${workspaceFormLabelSecondary}`}>
                This plan uses your latest cash estimate and active strategy.
                Inventory budget means money available to reinvest, not required
                spending.
              </p>
              <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-1 sm:px-5">
                <BreakdownRow
                  label="Estimated current cash"
                  amount={parseAmount(data.recommendations.current_cash ?? "0")}
                  variant="base"
                />
                <BreakdownRow
                  label={`Set aside for taxes (${formatPercent(data.recommendations.tax_reserve_bps)})`}
                  amount={parseAmount(
                    data.recommendations.tax_reserve_recommendation ?? "0",
                  )}
                  variant="subtract"
                />
                <BreakdownRow
                  label="Keep as cash buffer"
                  amount={parseAmount(
                    data.recommendations.cash_buffer_target ?? "0",
                  )}
                  variant="subtract"
                />
                <BreakdownRow
                  label="Available after protection"
                  amount={parseAmount(
                    data.recommendations.available_after_protection ?? "0",
                  )}
                  variant="result"
                />
                <BreakdownRow
                  label={`Inventory budget (${formatPercent(data.recommendations.reinvestment_bps)})`}
                  amount={parseAmount(
                    data.recommendations.reinvestment_recommendation ?? "0",
                  )}
                  variant="subtract"
                />
                <BreakdownRow
                  label="Safe owner draw"
                  amount={parseAmount(
                    data.recommendations.safe_owner_draw ?? "0",
                  )}
                  variant="highlight"
                />
              </div>
            </section>
          ) : null}

          {/* C — Event-adjusted cash details */}
          {data.recommendations.available ? (
            <section className={`p-4 sm:p-5 ${workspaceCard}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Event-adjusted cash
              </h2>
              <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                How your estimated current cash was built from your last
                snapshot and tracked activity.
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Last cash snapshot</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {data.recommendations.snapshot_amount &&
                    data.recommendations.snapshot_date ? (
                      <>
                        {formatCurrency(
                          parseAmount(data.recommendations.snapshot_amount),
                        )}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          on {formatDate(data.recommendations.snapshot_date)}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">
                    Estimated current cash
                  </dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(
                      parseAmount(data.recommendations.current_cash ?? "0"),
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-gray-500">Since last snapshot</dt>
                  <dd className="mt-2 space-y-1 text-sm tabular-nums text-gray-900">
                    <p>
                      + Inflows{" "}
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.total_inflows_since_snapshot ??
                            "0",
                        ),
                      )}
                    </p>
                    <p>
                      − Outflows{" "}
                      {formatCurrency(
                        parseAmount(
                          data.recommendations.total_outflows_since_snapshot ??
                            "0",
                        ),
                      )}
                    </p>
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          {/* D — Business Snapshot */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Business snapshot
                </h2>
                <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                  Spend totals cover the {SNAPSHOT_WINDOW_LABEL.toLowerCase()}{" "}
                  of recorded activity. Values are estimates based on what has
                  been entered, not a live bank balance.
                </p>
              </div>
              <Link
                href="/admin/strategy"
                className={workspaceActionSecondarySm}
              >
                Adjust strategy
              </Link>
            </div>
            <AdminSummaryStatGrid
              items={snapshotItems}
              aria-label="Business snapshot"
            />
          </section>

          {/* E — Cash Position */}
          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Cash position
            </h2>
            {data.cashSnapshot ? (
              <>
                <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
                  Reconcile when your actual cash on hand changes.
                  Recommendations start from your snapshot and adjust for
                  tracked activity since then.
                </p>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  Add a cash snapshot to unlock recommendations.
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

          {/* What's Missing */}
          <section className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-900/80">
              What&apos;s missing
            </h2>
            <p className="mt-1 text-sm text-amber-900/75">
              Recommendations use event-adjusted cash from your snapshot. These
              can improve accuracy over time:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-900/75">
              {!data.cashSnapshot ? (
                <li>
                  <span className="font-medium">Cash snapshot</span> — record
                  actual cash on hand to unlock recommendations.
                </li>
              ) : (
                <li>
                  <span className="font-medium">Fresh reconciliation</span> —
                  update your snapshot when cash changes.
                </li>
              )}
              <li>
                <span className="font-medium">Complete records</span> — keep
                show payouts, payments, expenses, inventory, and owner activity
                up to date so estimates stay accurate between reconciliations.
              </li>
            </ul>
            <FinancialsCrossLinks
              className="mt-3"
              label="Related"
              links={[
                { href: "/admin/financials/activity", label: "View activity" },
                { href: "/admin/strategy", label: "Adjust strategy" },
                { href: "/admin/expenses", label: "Record expense" },
              ]}
            />
          </section>
        </div>
      ) : null}
    </AdminWorkspacePageLayout>
  );
}
