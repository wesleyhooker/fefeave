"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpTooltip } from "@/app/(admin)/admin/_components/HelpTooltip";
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
    }
  | {
      id: string;
      type: "ITEMIZED";
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

  if (row.calculation_method === "ITEMIZED") {
    return {
      id: row.id,
      type: "ITEMIZED",
      fixedAmount: parsedAmount,
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

const STATUS_DOT: Record<string, string> = {
  Open: "bg-blue-500",
  Paid: "bg-emerald-500",
  Unpaid: "bg-amber-500",
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
  const closeOutSectionRef = useRef<HTMLDivElement>(null);
  const [newRowWholesalerId, setNewRowWholesalerId] = useState("");
  const [newRowMode, setNewRowMode] = useState<
    "PERCENT" | "FIXED" | "QTY_UNIT"
  >("PERCENT");
  const [newRowPercent, setNewRowPercent] = useState("");
  const [newRowFixed, setNewRowFixed] = useState("");
  const [newRowQty, setNewRowQty] = useState("");
  const [newRowUnitPrice, setNewRowUnitPrice] = useState("");
  const [newRowItemizedLines, setNewRowItemizedLines] = useState<
    Array<{
      id: string;
      itemName: string;
      quantity: string;
      unitPriceDollars: string;
    }>
  >([]);
  const [newRowError, setNewRowError] = useState<string | null>(null);

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

  const isPercentValueValid =
    newRowMode !== "PERCENT" ||
    (newRowPercent.trim() !== "" &&
      Number.isFinite(Number(newRowPercent)) &&
      Number(newRowPercent) >= 0 &&
      Number(newRowPercent) <= 100);

  const newRowTotal = useMemo(() => {
    if (newRowMode === "PERCENT") {
      const rate = Number(newRowPercent);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return null;
      return roundToCents((payoutAfterFees * rate) / 100);
    }
    if (newRowMode === "FIXED") {
      const amt = Number(newRowFixed);
      return Number.isFinite(amt) && amt > 0 ? roundToCents(amt) : null;
    }
    if (newRowMode === "QTY_UNIT") {
      let total = 0;
      for (const line of newRowItemizedLines) {
        const qty = Number(line.quantity);
        const unit = Number(line.unitPriceDollars);
        if (
          !Number.isFinite(qty) ||
          qty <= 0 ||
          !Number.isFinite(unit) ||
          unit < 0
        )
          return null;
        total += qty * unit;
      }
      return newRowItemizedLines.length > 0 ? roundToCents(total) : null;
    }
    return null;
  }, [
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    payoutAfterFees,
  ]);

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
      method: "PERCENT_PAYOUT" | "MANUAL" | "ITEMIZED";
      rate_percent?: number;
      amount?: number;
      lines?: { itemName: string; quantity: number; unitPrice: number }[];
    }): Promise<boolean> => {
      setCreatingSettlement(true);
      setCreateSettlementError(null);
      setNewRowError(null);
      try {
        await createShowSettlement(id, payload);
        setReloadToken((v) => v + 1);
        setNewRowWholesalerId("");
        setNewRowPercent("");
        setNewRowFixed("");
        setNewRowQty("");
        setNewRowUnitPrice("");
        setNewRowItemizedLines([]);
        return true;
      } catch (err) {
        setCreateSettlementError(toInlineWriteError(err));
        setNewRowError(toInlineWriteError(err));
        return false;
      } finally {
        setCreatingSettlement(false);
      }
    },
    [id, toInlineWriteError],
  );

  const handleAddRow = useCallback(async () => {
    if (isClosed) return;
    setNewRowError(null);
    if (!newRowWholesalerId) {
      setNewRowError("Select a wholesaler.");
      return;
    }
    if (newRowMode === "PERCENT") {
      const rate = Number(newRowPercent);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setNewRowError("Percent must be between 0 and 100.");
        return;
      }
      await handleCreateSettlement({
        wholesaler_id: newRowWholesalerId,
        method: "PERCENT_PAYOUT",
        rate_percent: rate,
      });
      return;
    }
    if (newRowMode === "QTY_UNIT") {
      if (newRowItemizedLines.length === 0) {
        setNewRowError(
          "Add at least one line (item name, quantity, unit price).",
        );
        return;
      }
      const lines: { itemName: string; quantity: number; unitPrice: number }[] =
        [];
      for (const line of newRowItemizedLines) {
        const name = line.itemName.trim();
        const qty = Number(line.quantity);
        const unitDollars = Number(line.unitPriceDollars);
        if (!name) {
          setNewRowError("Every line needs an item name.");
          return;
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          setNewRowError("Quantity must be a positive number for every line.");
          return;
        }
        if (!Number.isFinite(unitDollars) || unitDollars < 0) {
          setNewRowError("Unit price ($) must be 0 or more for every line.");
          return;
        }
        lines.push({
          itemName: name,
          quantity: qty,
          unitPrice: Math.round(unitDollars * 100),
        });
      }
      const ok = await handleCreateSettlement({
        wholesaler_id: newRowWholesalerId,
        method: "ITEMIZED",
        lines,
      });
      if (ok) setNewRowItemizedLines([]);
      return;
    }
    const amount = Number(newRowFixed);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNewRowError("Amount must be greater than 0.");
      return;
    }
    await handleCreateSettlement({
      wholesaler_id: newRowWholesalerId,
      method: "MANUAL",
      amount,
    });
  }, [
    isClosed,
    newRowWholesalerId,
    newRowMode,
    newRowPercent,
    newRowFixed,
    newRowItemizedLines,
    handleCreateSettlement,
  ]);

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
      {/* Header: title, date, status, primary action when open */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {showName || "Show"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Date: {showDate ? formatDate(showDate) : "—"}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
          Status:{" "}
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              isClosed ? "text-emerald-600" : "text-blue-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                isClosed ? "bg-emerald-500" : "bg-blue-500"
              }`}
              aria-hidden
            />
            {isClosed ? "Closed" : "Open"}
          </span>
        </p>
        {!isClosed && (
          <p className="mt-2">
            <button
              type="button"
              onClick={() => {
                closeOutSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="text-sm font-medium text-gray-600 underline decoration-gray-400 underline-offset-2 hover:text-gray-900 hover:decoration-gray-600"
            >
              Go to close out →
            </button>
          </p>
        )}
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

      {/* 2. Settlements — structured financial grid */}
      <section
        className={`border border-gray-200 ${
          isClosed ? "bg-gray-50/50" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-1.5 border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Settlements</h2>
          {isClosed && (
            <p className="text-xs text-gray-500">
              Locked — reopen show to add or remove.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Wholesaler
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Deal type
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit price
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Percent
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Paid
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Balance
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {settlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-4 text-center text-sm text-gray-500"
                  >
                    No settlements yet.
                    {!isClosed && " Add a row below."}
                  </td>
                </tr>
              ) : (
                settlements.map((row) => {
                  const owed = amountOwedFor(payoutAfterFees, row);
                  const balance = roundToCents(owed - row.amountPaid);
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-900">
                        {row.wholesaler}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-600">
                        {row.type === "PERCENT"
                          ? "Percent"
                          : row.type === "ITEMIZED"
                            ? "Itemized"
                            : "Flat"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-gray-500 tabular-nums">
                        —
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-gray-500 tabular-nums">
                        —
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-gray-600 tabular-nums">
                        {row.type === "PERCENT" ? `${row.percent}%` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-gray-600 tabular-nums">
                        {row.type === "FIXED"
                          ? formatCurrency(row.fixedAmount)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium text-gray-900 tabular-nums">
                        {formatCurrency(owed)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-gray-600 tabular-nums">
                        {formatCurrency(row.amountPaid)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium text-gray-900 tabular-nums">
                        {formatCurrency(balance)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm">
                        <button
                          type="button"
                          disabled={isClosed || deletingSettlementId === row.id}
                          onClick={() => void handleDeleteSettlement(row.id)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          {deletingSettlementId === row.id
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              {!isClosed && (
                <tr className="bg-gray-50/70 hover:bg-gray-100">
                  <td className="px-3 py-2.5">
                    <select
                      value={newRowWholesalerId}
                      onChange={(e) => setNewRowWholesalerId(e.target.value)}
                      className="w-full min-w-[120px] rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                    >
                      <option value="">Select wholesaler</option>
                      {wholesalers.map((w) => (
                        <option key={w.wholesaler_id} value={w.wholesaler_id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={newRowMode}
                      onChange={(e) => {
                        const v = e.target.value as
                          | "PERCENT"
                          | "FIXED"
                          | "QTY_UNIT";
                        setNewRowMode(
                          v === "FIXED" || v === "QTY_UNIT" ? v : "PERCENT",
                        );
                        if (
                          v === "QTY_UNIT" &&
                          newRowItemizedLines.length === 0
                        ) {
                          setNewRowItemizedLines([
                            {
                              id: crypto.randomUUID(),
                              itemName: "",
                              quantity: "",
                              unitPriceDollars: "",
                            },
                          ]);
                        }
                      }}
                      className="w-full min-w-[100px] rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                    >
                      <option value="PERCENT">Percent of payout</option>
                      <option value="FIXED">Flat amount ($)</option>
                      <option value="QTY_UNIT">Qty × unit price</option>
                    </select>
                  </td>
                  {newRowMode === "QTY_UNIT" ? (
                    <td colSpan={8} className="px-3 py-2.5 align-top">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Itemized lines (item × qty × unit price $)
                        </p>
                        {newRowItemizedLines.map((line) => {
                          const qty = Number(line.quantity);
                          const unit = Number(line.unitPriceDollars);
                          const lineTotal =
                            Number.isFinite(qty) &&
                            qty > 0 &&
                            Number.isFinite(unit) &&
                            unit >= 0
                              ? roundToCents(qty * unit)
                              : null;
                          return (
                            <div
                              key={line.id}
                              className="flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5"
                            >
                              <input
                                type="text"
                                value={line.itemName}
                                onChange={(e) =>
                                  setNewRowItemizedLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id
                                        ? { ...l, itemName: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                placeholder="Item name"
                                className="min-w-[120px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                step="1"
                                min={1}
                                value={line.quantity}
                                onChange={(e) =>
                                  setNewRowItemizedLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id
                                        ? { ...l, quantity: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                placeholder="Qty"
                                className="w-16 rounded border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums"
                              />
                              <span className="text-sm text-gray-500">×</span>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPriceDollars}
                                onChange={(e) =>
                                  setNewRowItemizedLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id
                                        ? {
                                            ...l,
                                            unitPriceDollars: e.target.value,
                                          }
                                        : l,
                                    ),
                                  )
                                }
                                placeholder="Unit $"
                                className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums"
                                title="Unit price ($)"
                              />
                              <span className="text-sm text-gray-500">=</span>
                              <span className="w-20 text-right text-sm font-medium tabular-nums text-gray-900">
                                {lineTotal != null
                                  ? formatCurrency(lineTotal)
                                  : "—"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewRowItemizedLines((prev) =>
                                    prev.filter((l) => l.id !== line.id),
                                  )
                                }
                                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewRowItemizedLines((prev) => [
                                ...prev,
                                {
                                  id: crypto.randomUUID(),
                                  itemName: "",
                                  quantity: "",
                                  unitPriceDollars: "",
                                },
                              ])
                            }
                            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            + Add line
                          </button>
                          <span className="text-sm font-medium text-gray-700">
                            Total settlement ={" "}
                            {newRowTotal != null
                              ? formatCurrency(newRowTotal)
                              : "—"}
                          </span>
                          <button
                            type="button"
                            disabled={
                              creatingSettlement ||
                              !newRowWholesalerId ||
                              newRowTotal == null ||
                              newRowItemizedLines.length === 0
                            }
                            onClick={() => void handleAddRow()}
                            className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {creatingSettlement ? "Adding…" : "Add row"}
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-sm text-gray-400">—</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-sm text-gray-400">—</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {newRowMode === "PERCENT" ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              max={100}
                              value={newRowPercent}
                              onChange={(e) => setNewRowPercent(e.target.value)}
                              className="w-16 rounded border border-gray-300 px-2 py-1.5 text-right text-sm tabular-nums"
                              placeholder="0"
                              aria-label="Percent of payout"
                            />
                            {payoutAfterFees <= 0 ? (
                              <span className="text-xs text-amber-600">
                                Save payout above first
                              </span>
                            ) : newRowTotal != null ? (
                              <span className="text-xs text-gray-500">
                                {newRowPercent || "0"}% of{" "}
                                {formatCurrency(payoutAfterFees)} ={" "}
                                {formatCurrency(newRowTotal)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {newRowMode === "FIXED" ? (
                          <div className="inline-flex items-center rounded border border-gray-300 bg-white">
                            <span className="pl-2 text-sm text-gray-500">
                              $
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={newRowFixed}
                              onChange={(e) => {
                                const v = e.target.value.replace(
                                  /[^0-9.]/g,
                                  "",
                                );
                                const parts = v.split(".");
                                if (parts.length > 2) return;
                                if (parts[1]?.length > 2) return;
                                setNewRowFixed(v);
                              }}
                              className="w-20 rounded py-1.5 pr-2 text-right text-sm tabular-nums"
                              placeholder="0.00"
                              aria-label="Amount (USD)"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium text-gray-900 tabular-nums">
                        {newRowTotal != null
                          ? formatCurrency(newRowTotal)
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm text-gray-400">
                        —
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm text-gray-400">
                        —
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={
                            creatingSettlement ||
                            !newRowWholesalerId ||
                            newRowTotal == null ||
                            (newRowMode === "PERCENT" &&
                              payoutAfterFees <= 0) ||
                            !isPercentValueValid
                          }
                          onClick={() => void handleAddRow()}
                          className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            newRowMode === "PERCENT" && !isPercentValueValid
                              ? "Enter a percent (0–100) to add row"
                              : undefined
                          }
                        >
                          {creatingSettlement ? "Adding…" : "Add row"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(deleteSettlementError || createSettlementError || newRowError) && (
          <p className="px-4 py-3 text-sm text-amber-700" role="alert">
            {deleteSettlementError ??
              (createSettlementError?.toLowerCase().includes("financials")
                ? "Save payout after fees above, then try adding the settlement again."
                : createSettlementError) ??
              (newRowError?.toLowerCase().includes("financials")
                ? "Save payout after fees above, then try adding the settlement again."
                : newRowError)}
          </p>
        )}
      </section>

      {/* 3. Review & profit */}
      <section className="border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Review & profit
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-500">
                  Payout after fees
                </td>
                <td className="w-28 py-2 text-right tabular-nums text-gray-900">
                  {formatCurrency(payoutAfterFees)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-500">
                  Total owed
                </td>
                <td className="w-28 py-2 text-right tabular-nums text-gray-900">
                  {formatCurrency(totals.totalOwed)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-500">
                  Total paid
                </td>
                <td className="w-28 py-2 text-right tabular-nums text-gray-900">
                  {formatCurrency(totals.totalPaid)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-500">
                  Balance remaining
                </td>
                <td className="w-28 py-2 text-right tabular-nums text-gray-900">
                  {formatCurrency(totals.balanceRemaining)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-500">Status</td>
                <td className="w-28 py-2 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[totals.status] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_DOT[totals.status] && (
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[totals.status]}`}
                        aria-hidden
                      />
                    )}
                    {totals.status}
                  </span>
                </td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="py-3 pr-4 font-medium text-gray-700">
                  <HelpTooltip content="Profit = payout after fees − settlements owed to wholesalers">
                    <span className="inline-flex items-center gap-1">
                      Profit
                      <span
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-[10px] font-semibold text-gray-500"
                        aria-hidden
                      >
                        i
                      </span>
                    </span>
                  </HelpTooltip>
                </td>
                <td className="w-28 py-3 text-right font-semibold tabular-nums text-gray-900">
                  {formatCurrency(totals.profitEstimate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Close / Reopen */}
      <section
        ref={closeOutSectionRef}
        className="border border-gray-200 bg-white p-4"
      >
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
                Lock payout and settlements so they can&apos;t be changed.
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

  const parsed = Number(input.replace(/,/g, ""));
  const canSave = Number.isFinite(parsed) && parsed >= 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
          aria-hidden
        >
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) return;
            if (parts[1]?.length > 2) return;
            setInput(v);
          }}
          disabled={disabled}
          className="w-28 rounded border border-gray-300 py-2 pl-7 pr-3 text-sm tabular-nums text-gray-900 disabled:opacity-50"
          placeholder="0.00"
          aria-label="Payout amount in dollars"
        />
      </div>
      <button
        type="button"
        onClick={async () => {
          if (!canSave || saving || disabled) return;
          const ok = await onSave(roundToCents(Number(parsed)));
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
