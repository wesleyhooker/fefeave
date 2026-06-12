"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  fetchFinancialStrategy,
  saveFinancialStrategy,
  type FinancialStrategyDTO,
} from "@/src/lib/api/financial-strategy";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  RECOMMENDED_STRATEGY_TYPE,
  STRATEGY_CASH_BUFFER_HELPER,
  STRATEGY_OPTIONS,
  STRATEGY_PRESETS_HELPER,
  bpsToPercent,
  percentToBps,
  valuesForStrategyType,
  type StrategyPresetValues,
  type StrategyType,
} from "@/src/lib/constants/financial-strategy";
import Link from "next/link";
import { DASHBOARD_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  workspaceActionCompleteMd,
  workspaceActionSecondarySm,
  workspaceCard,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(bps: number): string {
  return `${bpsToPercent(bps)}%`;
}

function customValuesFromRow(row: FinancialStrategyDTO): StrategyPresetValues {
  return {
    tax_reserve_bps: row.tax_reserve_bps,
    reinvestment_bps: row.reinvestment_bps,
    cash_buffer_amount: parseAmount(row.cash_buffer_amount),
  };
}

function applyCustomValuesToForm(
  values: StrategyPresetValues,
  setTaxPercent: (v: string) => void,
  setReinvestPercent: (v: string) => void,
  setCashBuffer: (v: string) => void,
) {
  setTaxPercent(String(bpsToPercent(values.tax_reserve_bps)));
  setReinvestPercent(String(bpsToPercent(values.reinvestment_bps)));
  setCashBuffer(String(values.cash_buffer_amount));
}

export default function AdminStrategyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [strategyType, setStrategyType] = useState<StrategyType>("BALANCED");
  const [taxPercent, setTaxPercent] = useState("30");
  const [reinvestPercent, setReinvestPercent] = useState("50");
  const [cashBuffer, setCashBuffer] = useState("2000");
  const [savedCustomValues, setSavedCustomValues] =
    useState<StrategyPresetValues | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isCustom = strategyType === "CUSTOM";

  const activeValues = useMemo(
    () =>
      valuesForStrategyType(strategyType, {
        tax_reserve_bps: percentToBps(parseAmount(taxPercent)),
        reinvestment_bps: percentToBps(parseAmount(reinvestPercent)),
        cash_buffer_amount: parseAmount(cashBuffer),
      }),
    [strategyType, taxPercent, reinvestPercent, cashBuffer],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFinancialStrategy()
      .then((row: FinancialStrategyDTO) => {
        if (cancelled) return;
        setStrategyType(row.strategy_type);
        setTaxPercent(String(bpsToPercent(row.tax_reserve_bps)));
        setReinvestPercent(String(bpsToPercent(row.reinvestment_bps)));
        setCashBuffer(String(parseAmount(row.cash_buffer_amount)));
        if (row.strategy_type === "CUSTOM") {
          setSavedCustomValues(customValuesFromRow(row));
        }
      })
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

  function selectStrategy(type: StrategyType) {
    setStrategyType(type);
    setSavedMessage(null);
    if (type === "CUSTOM") {
      const custom =
        savedCustomValues ??
        valuesForStrategyType("CUSTOM", {
          tax_reserve_bps: percentToBps(parseAmount(taxPercent)),
          reinvestment_bps: percentToBps(parseAmount(reinvestPercent)),
          cash_buffer_amount: parseAmount(cashBuffer),
        });
      applyCustomValuesToForm(
        custom,
        setTaxPercent,
        setReinvestPercent,
        setCashBuffer,
      );
      return;
    }
    const preset = valuesForStrategyType(type);
    applyCustomValuesToForm(
      preset,
      setTaxPercent,
      setReinvestPercent,
      setCashBuffer,
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSavedMessage(null);

    const taxBps = percentToBps(parseAmount(taxPercent));
    const reinvestBps = percentToBps(parseAmount(reinvestPercent));
    const bufferAmount = parseAmount(cashBuffer);

    if (isCustom) {
      if (
        Number.isNaN(parseAmount(taxPercent)) ||
        taxBps < 0 ||
        taxBps > 10000
      ) {
        setSubmitError("Tax reserve must be between 0% and 100%.");
        return;
      }
      if (
        Number.isNaN(parseAmount(reinvestPercent)) ||
        reinvestBps < 0 ||
        reinvestBps > 10000
      ) {
        setSubmitError("Reinvestment must be between 0% and 100%.");
        return;
      }
      if (taxBps + reinvestBps > 10000) {
        setSubmitError(
          "Tax reserve and reinvestment together cannot exceed 100% of available cash.",
        );
        return;
      }
      if (Number.isNaN(bufferAmount) || bufferAmount < 0) {
        setSubmitError("Cash buffer must be zero or greater.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload =
        strategyType === "CUSTOM"
          ? {
              strategy_type: strategyType,
              tax_reserve_bps: taxBps,
              reinvestment_bps: reinvestBps,
              cash_buffer_amount: bufferAmount,
            }
          : { strategy_type: strategyType };

      await saveFinancialStrategy(payload);
      if (strategyType === "CUSTOM") {
        setSavedCustomValues({
          tax_reserve_bps: taxBps,
          reinvestment_bps: reinvestBps,
          cash_buffer_amount: bufferAmount,
        });
      }
      setReloadToken((t) => t + 1);
      setSavedMessage("Strategy saved.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminWorkspacePageLayout
      containerTier="compact"
      intro={
        <AdminWorkspacePageIntro
          title="Financial Preferences"
          subtitle="Choose how to split available cash between taxes, reinvestment, and your take-home."
        />
      }
    >
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : error ? (
        <WorkspaceInlineError
          title="Could not load strategy settings."
          message={error}
          onRetry={() => setReloadToken((t) => t + 1)}
        />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Strategy preset
            </h2>
            <p className={`mt-1 text-sm ${workspaceFormLabelSecondary}`}>
              Not sure? Start with{" "}
              <span className="font-medium text-gray-800">Balanced</span> — you
              can change this anytime.
            </p>
            <p className={`mt-2 text-sm ${workspaceFormLabelSecondary}`}>
              {STRATEGY_PRESETS_HELPER}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {STRATEGY_OPTIONS.map((option) => {
                const selected = strategyType === option.type;
                const presetValues = valuesForStrategyType(option.type);
                const isRecommended = option.type === RECOMMENDED_STRATEGY_TYPE;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => selectStrategy(option.type)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-stone-800 bg-stone-50 ring-1 ring-stone-800/10"
                        : "border-gray-200 bg-white hover:border-stone-400"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {option.label}
                        </p>
                        <p className="mt-1 text-sm leading-snug text-gray-600">
                          {option.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {isRecommended ? (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-700">
                            Recommended start
                          </span>
                        ) : null}
                        {selected ? (
                          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {option.type !== "CUSTOM" ? (
                      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-gray-500">Tax reserve</dt>
                          <dd className="font-medium text-gray-900">
                            {formatPercent(presetValues.tax_reserve_bps)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Reinvestment</dt>
                          <dd className="font-medium text-gray-900">
                            {formatPercent(presetValues.reinvestment_bps)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Cash buffer</dt>
                          <dd className="font-medium text-gray-900">
                            {formatCurrency(presetValues.cash_buffer_amount)}
                          </dd>
                        </div>
                      </dl>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`p-4 sm:p-5 ${workspaceCard}`}>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Allocation settings
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Reinvestment applies after tax reserve. Owner draw is the
              remainder after tax reserve, cash buffer, and reinvestment — not
              stored separately in V1.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:max-w-xl">
              <label className="block min-w-0">
                <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                  Tax reserve (%)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  disabled={!isCustom}
                  className={`w-full min-w-0 max-w-[10rem] ${workspaceTextInput} disabled:bg-gray-50 disabled:text-gray-600`}
                  inputMode="decimal"
                />
              </label>
              <label className="block min-w-0">
                <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                  Reinvestment (%)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={reinvestPercent}
                  onChange={(e) => setReinvestPercent(e.target.value)}
                  disabled={!isCustom}
                  className={`w-full min-w-0 max-w-[10rem] ${workspaceTextInput} disabled:bg-gray-50 disabled:text-gray-600`}
                  inputMode="decimal"
                />
              </label>
              <label className="block min-w-0">
                <span className={`mb-1.5 block ${workspaceFormLabel}`}>
                  Cash buffer ($)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashBuffer}
                  onChange={(e) => setCashBuffer(e.target.value)}
                  disabled={!isCustom}
                  className={`w-full min-w-0 max-w-[10rem] ${workspaceTextInput} disabled:bg-gray-50 disabled:text-gray-600`}
                  inputMode="decimal"
                />
                <p className={`mt-1.5 text-xs ${workspaceFormLabelSecondary}`}>
                  {STRATEGY_CASH_BUFFER_HELPER}
                </p>
              </label>
            </div>
            {!isCustom ? (
              <p className={`mt-4 text-sm ${workspaceFormLabelSecondary}`}>
                Preset values: tax {formatPercent(activeValues.tax_reserve_bps)}
                , reinvest {formatPercent(activeValues.reinvestment_bps)},
                buffer {formatCurrency(activeValues.cash_buffer_amount)}.
              </p>
            ) : null}
            <div className="pt-5">
              <button
                type="submit"
                disabled={submitting}
                className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-50 sm:w-auto`}
              >
                {submitting ? "Saving…" : "Save strategy"}
              </button>
            </div>
            {submitError ? (
              <p className="mt-3 text-sm text-amber-700" role="alert">
                {submitError}
              </p>
            ) : null}
            {savedMessage ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-emerald-700" role="status">
                  {savedMessage}
                </p>
                <Link
                  href={DASHBOARD_HREF}
                  className={workspaceActionSecondarySm}
                >
                  View on Dashboard
                </Link>
              </div>
            ) : null}
          </section>
        </form>
      )}
    </AdminWorkspacePageLayout>
  );
}
