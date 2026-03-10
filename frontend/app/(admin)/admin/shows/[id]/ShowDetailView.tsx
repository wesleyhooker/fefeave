"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchWholesalerBalances,
  type BackendWholesalerBalanceRow,
} from "@/src/lib/api/wholesalers";
import {
  createShowSettlement,
  deleteShowSettlement,
  fetchShow,
  fetchShowFinancials,
  fetchShowSettlements,
  updateShowStatus,
  upsertShowFinancials,
  type ShowSettlementDTO,
} from "@/src/lib/api/shows";

type StructuredSettlement =
  | {
      id: string;
      type: "PERCENT";
      percent: number;
      wholesaler: string;
      amountPaid: number;
    }
  | {
      id: string;
      type: "FIXED";
      fixedAmount: number;
      wholesaler: string;
      amountPaid: number;
    };

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function amountOwedFor(
  payoutAfterFees: number,
  settlement: StructuredSettlement,
): number {
  if (settlement.type === "PERCENT") {
    return roundToCents((payoutAfterFees * settlement.percent) / 100);
  }
  return roundToCents(settlement.fixedAmount);
}

function percentOrFixedDisplay(settlement: StructuredSettlement): string {
  if (settlement.type === "PERCENT") return `${settlement.percent}%`;
  return formatCurrency(settlement.fixedAmount);
}

function deriveStatusFromTotals(
  balanceRemaining: number,
  isClosed: boolean,
): string {
  if (!isClosed) return "Open";
  return balanceRemaining <= 0 ? "Paid" : "Unpaid";
}

function computeTotals(
  payoutAfterFees: number,
  settlements: StructuredSettlement[],
  closedAt?: string,
) {
  const totalOwed = settlements.reduce(
    (sum, row) => sum + amountOwedFor(payoutAfterFees, row),
    0,
  );
  const totalPaid = settlements.reduce((sum, row) => sum + row.amountPaid, 0);
  const balanceRemaining = roundToCents(totalOwed - totalPaid);
  const profitEstimate = roundToCents(payoutAfterFees - totalOwed);
  const status = deriveStatusFromTotals(balanceRemaining, Boolean(closedAt));
  return {
    totalOwed: roundToCents(totalOwed),
    totalPaid: roundToCents(totalPaid),
    balanceRemaining,
    profitEstimate,
    status,
  };
}

function mapSettlementRow(
  row: ShowSettlementDTO,
  nameByWholesalerId: Record<string, string>,
): StructuredSettlement {
  const amount = Number(row.amount);
  const parsedAmount = Number.isFinite(amount) ? amount : 0;
  const wholesaler = nameByWholesalerId[row.wholesaler_id] ?? "Unknown";

  if (row.calculation_method === "PERCENT_PAYOUT") {
    const rateBps = row.rate_bps ?? 0;
    return {
      id: row.id,
      type: "PERCENT",
      percent: rateBps / 100,
      wholesaler,
      amountPaid: 0,
    };
  }

  return {
    id: row.id,
    type: "FIXED",
    fixedAmount: parsedAmount,
    wholesaler,
    amountPaid: 0,
  };
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Unpaid: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

export function ShowDetailView({ id }: { id: string }) {
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState("");
  const [closedAt, setClosedAt] = useState<string | undefined>(undefined);
  const [payoutAfterFees, setPayoutAfterFees] = useState(0);
  const [settlements, setSettlements] = useState<StructuredSettlement[]>([]);
  const [wholesalers, setWholesalers] = useState<BackendWholesalerBalanceRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [savePayoutError, setSavePayoutError] = useState<string | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const [createSettlementError, setCreateSettlementError] = useState<
    string | null
  >(null);
  const [creatingSettlement, setCreatingSettlement] = useState(false);
  const [deleteSettlementError, setDeleteSettlementError] = useState<
    string | null
  >(null);
  const [deletingSettlementId, setDeletingSettlementId] = useState<
    string | null
  >(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchShow(id),
      fetchShowFinancials(id),
      fetchShowSettlements(id),
      fetchWholesalerBalances(),
    ])
      .then(([show, financials, settlementRows, balances]) => {
        if (cancelled) return;
        const nameByWholesalerId = balances.reduce<Record<string, string>>(
          (acc, row) => {
            acc[row.wholesaler_id] = row.name;
            return acc;
          },
          {},
        );
        setShowName(show.name);
        setShowDate(show.show_date);
        const payout = Number(financials?.payout_after_fees_amount ?? "0");
        setPayoutAfterFees(Number.isFinite(payout) ? payout : 0);
        setClosedAt(
          show.status === "COMPLETED" ? (show.updated_at ?? "") : undefined,
        );
        setSettlements(
          settlementRows.map((row) =>
            mapSettlementRow(row, nameByWholesalerId),
          ),
        );
        setWholesalers(balances);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const totals = useMemo(
    () => computeTotals(payoutAfterFees, settlements, closedAt),
    [payoutAfterFees, settlements, closedAt],
  );

  const isClosed = Boolean(closedAt);

  const handleRetry = useCallback(() => {
    setReloadToken((v) => v + 1);
  }, []);

  const toInlineWriteError = useCallback((err: unknown): string => {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("(401 ") || message.includes("(403 ")) {
      return "You are not authorized to perform this action.";
    }
    return message;
  }, []);

  const handleSavePayout = useCallback(
    async (nextPayoutAfterFees: number): Promise<boolean> => {
      setSavingPayout(true);
      setSavePayoutError(null);
      try {
        await upsertShowFinancials(id, {
          payout_after_fees_amount: nextPayoutAfterFees,
        });
        setReloadToken((v) => v + 1);
        return true;
      } catch (err) {
        setSavePayoutError(toInlineWriteError(err));
        return false;
      } finally {
        setSavingPayout(false);
      }
    },
    [id, toInlineWriteError],
  );

  const handleCreateSettlement = useCallback(
    async (payload: {
      wholesaler_id: string;
      method: "PERCENT_PAYOUT" | "MANUAL";
      rate_percent?: number;
      amount?: number;
    }): Promise<boolean> => {
      setCreatingSettlement(true);
      setCreateSettlementError(null);
      try {
        await createShowSettlement(id, payload);
        setReloadToken((v) => v + 1);
        return true;
      } catch (err) {
        setCreateSettlementError(toInlineWriteError(err));
        return false;
      } finally {
        setCreatingSettlement(false);
      }
    },
    [id, toInlineWriteError],
  );

  const handleDeleteSettlement = useCallback(
    async (settlementId: string) => {
      if (!window.confirm("Delete this settlement?")) return;
      setDeletingSettlementId(settlementId);
      setDeleteSettlementError(null);
      try {
        await deleteShowSettlement(id, settlementId);
        setReloadToken((v) => v + 1);
      } catch (err) {
        setDeleteSettlementError(toInlineWriteError(err));
      } finally {
        setDeletingSettlementId(null);
      }
    },
    [id, toInlineWriteError],
  );

  const handleCloseShow = useCallback(async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await updateShowStatus(id, "COMPLETED");
      setClosedAt(new Date().toISOString());
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, toInlineWriteError]);

  const handleReopenShow = useCallback(async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await updateShowStatus(id, "ACTIVE");
      setClosedAt(undefined);
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCloseError(toInlineWriteError(err));
    } finally {
      setClosing(false);
    }
  }, [id, toInlineWriteError]);

  if (loading) {
    return <p className="text-gray-600">Loading show details...</p>;
  }

  if (error) {
    return (
      <div
        className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="alert"
      >
        <p className="font-medium">Could not load show detail.</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: title, date, closed note — minimal chrome */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {showName || "Show"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Date: {showDate ? formatDate(showDate) : "—"}
        </p>
        {isClosed && (
          <p className="mt-3 text-sm text-gray-600">
            This show is closed. Payout and settlements are locked; you can
            still record payments.
          </p>
        )}
      </div>

      {/* 1. Payout after fees */}
      <section
        className={`border border-gray-200 p-4 ${
          isClosed ? "bg-gray-50/50" : "bg-white"
        }`}
      >
        <h2 className="text-base font-semibold text-gray-900">
          Payout after fees
        </h2>
        {isClosed && (
          <p className="mt-1 text-xs text-gray-500">
            Locked — reopen show to edit.
          </p>
        )}
        <EditablePayout
          payoutAfterFees={payoutAfterFees}
          saving={savingPayout}
          disabled={isClosed}
          onSave={handleSavePayout}
        />
        {savePayoutError && (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {savePayoutError}
          </p>
        )}
      </section>

      {/* 2. Settlements */}
      <section
        className={`border border-gray-200 ${
          isClosed ? "bg-gray-50/50" : "bg-white"
        }`}
      >
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Settlements</h2>
          {isClosed && (
            <p className="mt-0.5 text-xs text-gray-500">
              Locked — reopen show to add or remove.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Wholesaler
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Deal type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount Owed
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Balance Remaining
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {settlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                settlements.map((row) => {
                  const owed = amountOwedFor(payoutAfterFees, row);
                  const balance = roundToCents(owed - row.amountPaid);
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {row.wholesaler}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {percentOrFixedDisplay(row)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(owed)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(row.amountPaid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(balance)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <button
                          type="button"
                          disabled
                          className="mr-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isClosed || deletingSettlementId === row.id}
                          onClick={() => void handleDeleteSettlement(row.id)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          {deletingSettlementId === row.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {deleteSettlementError && (
          <p className="px-4 pb-3 text-sm text-amber-700" role="alert">
            {deleteSettlementError}
          </p>
        )}
      </section>

      <section className="border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Add settlement
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Add one at a time. Percent and quantity×price are calculated from your
          entries; flat amount is the amount you enter.
        </p>
        <AddSettlementForm
          wholesalers={wholesalers}
          creating={creatingSettlement}
          disabled={isClosed}
          onSubmit={handleCreateSettlement}
        />
        {createSettlementError && (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {createSettlementError}
          </p>
        )}
      </section>

      {/* 3. Review / profit — structured row, not cards */}
      <section className="border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Review & profit
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Totals and profit estimate. Close out when final.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-6 font-medium text-gray-500">
                  Payout after fees
                </td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(payoutAfterFees)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-medium text-gray-500">
                  Total owed
                </td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(totals.totalOwed)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-medium text-gray-500">
                  Total paid
                </td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(totals.totalPaid)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-medium text-gray-500">
                  Balance remaining
                </td>
                <td className="py-2 text-right text-gray-900">
                  {formatCurrency(totals.balanceRemaining)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-6 font-medium text-gray-500">Status</td>
                <td className="py-2 text-right">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[totals.status] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {totals.status}
                  </span>
                </td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="py-3 pr-6 font-medium text-gray-700">
                  Profit estimate (payout − owed)
                </td>
                <td className="py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(totals.profitEstimate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Close / Reopen */}
      <section className="border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Close out show
        </h2>
        {totals.status === "Open" ? (
          showCloseConfirm ? (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">
                Payout and settlements will be locked until you reopen. You can
                still record payments.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseConfirm(false);
                    void handleCloseShow();
                  }}
                  disabled={closing}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {closing ? "Closing…" : "Close out show"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  disabled={closing}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mt-1 text-sm text-gray-600">
                Lock payout and settlements so they can't be changed. You can
                still record payments from Payments.
              </p>
              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                disabled={closing}
                className="mt-3 rounded border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Close out show
              </button>
            </div>
          )
        ) : showReopenConfirm ? (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            <p className="font-medium">
              Reopening will allow you to edit payout and settlements again.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReopenConfirm(false);
                  void handleReopenShow();
                }}
                disabled={closing}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {closing
                  ? "Reopening…"
                  : "Reopen show (unlocks payout and settlements)"}
              </button>
              <button
                type="button"
                onClick={() => setShowReopenConfirm(false)}
                disabled={closing}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-600">
              Reopen to edit payout or settlements.
            </p>
            <button
              type="button"
              onClick={() => setShowReopenConfirm(true)}
              disabled={closing}
              className="mt-3 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reopen show (unlocks payout and settlements)
            </button>
          </>
        )}
        {closeError && (
          <p className="mt-3 text-sm text-amber-700" role="alert">
            {closeError}
          </p>
        )}
      </section>
    </div>
  );
}

function EditablePayout({
  payoutAfterFees,
  saving,
  disabled,
  onSave,
}: {
  payoutAfterFees: number;
  saving: boolean;
  disabled?: boolean;
  onSave: (amount: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(payoutAfterFees));

  useEffect(() => {
    setInput(String(payoutAfterFees));
  }, [payoutAfterFees]);

  if (!editing) {
    return (
      <div className="mt-3 flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-900">
          {formatCurrency(payoutAfterFees)}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setEditing(true)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit
        </button>
      </div>
    );
  }

  const parsed = Number(input);
  const canSave = Number.isFinite(parsed) && parsed >= 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        className="w-44 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={async () => {
          if (!canSave || saving || disabled) return;
          const ok = await onSave(roundToCents(parsed));
          if (ok) setEditing(false);
        }}
        disabled={disabled || !canSave || saving}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setInput(String(payoutAfterFees));
          setEditing(false);
        }}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  );
}

type DealMode = "PERCENT" | "FIXED" | "QTY_UNIT";

function AddSettlementForm({
  wholesalers,
  creating,
  disabled,
  onSubmit,
}: {
  wholesalers: BackendWholesalerBalanceRow[];
  creating: boolean;
  disabled?: boolean;
  onSubmit: (payload: {
    wholesaler_id: string;
    method: "PERCENT_PAYOUT" | "MANUAL";
    rate_percent?: number;
    amount?: number;
  }) => Promise<boolean>;
}) {
  const [wholesalerId, setWholesalerId] = useState("");
  const [mode, setMode] = useState<DealMode>("PERCENT");
  const [percentInput, setPercentInput] = useState("");
  const [fixedInput, setFixedInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    setLocalError(null);

    if (!wholesalerId) {
      setLocalError("Select a wholesaler.");
      return;
    }

    if (mode === "PERCENT") {
      const rate = Number(percentInput);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setLocalError("Percent must be between 0 and 100.");
        return;
      }
      const ok = await onSubmit({
        wholesaler_id: wholesalerId,
        method: "PERCENT_PAYOUT",
        rate_percent: rate,
      });
      if (ok) setPercentInput("");
      return;
    }

    if (mode === "QTY_UNIT") {
      const qty = Number(qtyInput);
      const unitPrice = Number(unitPriceInput);
      if (
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        setLocalError(
          "Enter quantity and unit price (both required, quantity > 0).",
        );
        return;
      }
      const amount = roundToCents(qty * unitPrice);
      if (amount <= 0) {
        setLocalError("Quantity × unit price must be greater than 0.");
        return;
      }
      const ok = await onSubmit({
        wholesaler_id: wholesalerId,
        method: "MANUAL",
        amount,
      });
      if (ok) {
        setQtyInput("");
        setUnitPriceInput("");
      }
      return;
    }

    const amount = Number(fixedInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("Amount must be greater than 0.");
      return;
    }
    const ok = await onSubmit({
      wholesaler_id: wholesalerId,
      method: "MANUAL",
      amount,
    });
    if (ok) setFixedInput("");
  };

  const dealTypeHelper =
    mode === "PERCENT"
      ? "Software will calculate amount from payout after fees. Enter percent (e.g. 25 for 25%)."
      : mode === "FIXED"
        ? "Enter the flat amount you owe this wholesaler for this show."
        : "Enter quantity and unit price; software will calculate total (no SKU required).";

  return (
    <form
      className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
      onSubmit={submit}
    >
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Wholesaler
        </label>
        <select
          value={wholesalerId}
          onChange={(e) => setWholesalerId(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Select wholesaler</option>
          {wholesalers.map((w) => (
            <option key={w.wholesaler_id} value={w.wholesaler_id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Deal type
        </label>
        <select
          value={mode}
          onChange={(e) => {
            const v = e.target.value as DealMode;
            setMode(v === "FIXED" || v === "QTY_UNIT" ? v : "PERCENT");
          }}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="PERCENT">
            Percent of payout (software calculates)
          </option>
          <option value="FIXED">Flat amount</option>
          <option value="QTY_UNIT">
            Quantity × unit price (software calculates)
          </option>
        </select>
        <p className="mt-1 text-xs text-gray-500">{dealTypeHelper}</p>
      </div>
      {mode === "PERCENT" && (
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Percent of payout
          </label>
          <input
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            type="number"
            step="0.01"
            min={0}
            max={100}
            placeholder="e.g. 50"
            className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      )}
      {mode === "FIXED" && (
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount ($)
          </label>
          <input
            value={fixedInput}
            onChange={(e) => setFixedInput(e.target.value)}
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g. 150.00"
            className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      )}
      {mode === "QTY_UNIT" && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              type="number"
              step="1"
              min={1}
              placeholder="e.g. 10"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Unit price ($)
            </label>
            <input
              value={unitPriceInput}
              onChange={(e) => setUnitPriceInput(e.target.value)}
              type="number"
              step="0.01"
              min={0}
              placeholder="e.g. 12.50"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>
          {qtyInput &&
            unitPriceInput &&
            Number(qtyInput) > 0 &&
            Number(unitPriceInput) >= 0 && (
              <p className="md:col-span-2 text-xs text-gray-600">
                Total:{" "}
                {formatCurrency(
                  roundToCents(Number(qtyInput) * Number(unitPriceInput)),
                )}
              </p>
            )}
        </>
      )}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={disabled || creating}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {creating ? "Adding…" : "Add settlement"}
        </button>
        {localError && (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {localError}
          </p>
        )}
      </div>
    </form>
  );
}
