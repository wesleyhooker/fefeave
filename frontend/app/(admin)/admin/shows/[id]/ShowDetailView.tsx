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
        setClosedAt(undefined);
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          {showName || "Show"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Date: {showDate ? formatDate(showDate) : "—"}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Payout After Fees"
          value={formatCurrency(payoutAfterFees)}
        />
        <SummaryCard
          label="Total Owed"
          value={formatCurrency(totals.totalOwed)}
        />
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(totals.totalPaid)}
        />
        <SummaryCard
          label="Balance Remaining"
          value={formatCurrency(totals.balanceRemaining)}
        />
        <SummaryCard
          label="Status"
          value={
            <span
              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[totals.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {totals.status}
            </span>
          }
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Payout After Fees
        </h2>
        <EditablePayout
          payoutAfterFees={payoutAfterFees}
          saving={savingPayout}
          onApplyLocal={setPayoutAfterFees}
          onSave={handleSavePayout}
        />
        {savePayoutError && (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {savePayoutError}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900">
          Settlements
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Wholesaler
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Percent / Fixed
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
                          title="Wiring in progress"
                          className="mr-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingSettlementId === row.id}
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

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add Settlement</h2>
        <AddSettlementForm
          wholesalers={wholesalers}
          creating={creatingSettlement}
          onSubmit={handleCreateSettlement}
        />
        {createSettlementError && (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {createSettlementError}
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function EditablePayout({
  payoutAfterFees,
  saving,
  onApplyLocal,
  onSave,
}: {
  payoutAfterFees: number;
  saving: boolean;
  onApplyLocal: (amount: number) => void;
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
          onClick={() => setEditing(true)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
      </div>
    );
  }

  const parsed = Number(input);
  const canApply = Number.isFinite(parsed) && parsed >= 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="number"
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-44 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
      />
      <button
        type="button"
        onClick={() => {
          if (!canApply) return;
          onApplyLocal(roundToCents(parsed));
          setEditing(false);
        }}
        disabled={!canApply}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apply Locally
      </button>
      <button
        type="button"
        onClick={async () => {
          if (!canApply || saving) return;
          const ok = await onSave(roundToCents(parsed));
          if (ok) setEditing(false);
        }}
        disabled={!canApply || saving}
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

function AddSettlementForm({
  wholesalers,
  creating,
  onSubmit,
}: {
  wholesalers: BackendWholesalerBalanceRow[];
  creating: boolean;
  onSubmit: (payload: {
    wholesaler_id: string;
    method: "PERCENT_PAYOUT" | "MANUAL";
    rate_percent?: number;
    amount?: number;
  }) => Promise<boolean>;
}) {
  const [wholesalerId, setWholesalerId] = useState("");
  const [mode, setMode] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [percentInput, setPercentInput] = useState("");
  const [fixedInput, setFixedInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      if (ok) {
        setPercentInput("");
      }
      return;
    }

    const amount = Number(fixedInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalError("Fixed amount must be greater than 0.");
      return;
    }
    const ok = await onSubmit({
      wholesaler_id: wholesalerId,
      method: "MANUAL",
      amount,
    });
    if (ok) {
      setFixedInput("");
    }
  };

  return (
    <form
      className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
      onSubmit={submit}
    >
      <select
        value={wholesalerId}
        onChange={(e) => setWholesalerId(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="">Wholesaler</option>
        {wholesalers.map((w) => (
          <option key={w.wholesaler_id} value={w.wholesaler_id}>
            {w.name}
          </option>
        ))}
      </select>
      <select
        value={mode}
        onChange={(e) =>
          setMode(e.target.value === "FIXED" ? "FIXED" : "PERCENT")
        }
        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="PERCENT">Percent</option>
        <option value="FIXED">Fixed</option>
      </select>
      <input
        value={percentInput}
        onChange={(e) => setPercentInput(e.target.value)}
        disabled={mode !== "PERCENT"}
        type="number"
        step="0.01"
        placeholder="Percent"
        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:text-gray-500"
      />
      <input
        value={fixedInput}
        onChange={(e) => setFixedInput(e.target.value)}
        disabled={mode !== "FIXED"}
        type="number"
        step="0.01"
        placeholder="Fixed amount"
        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:text-gray-500"
      />
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {creating ? "Adding..." : "Add Settlement"}
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
