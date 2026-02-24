"use client";

import { useState, useMemo, useCallback } from "react";
import type { ShowDetail, SettlementRow } from "@/lib/mockData";
import { deriveStatusFromTotals } from "@/lib/mockData";

// --- Client-only structured settlement (used by ShowDetailView state) ---

export type StructuredSettlement =
  | {
      type: "PERCENT";
      percent: number;
      wholesaler: string;
      amountPaid: number;
    }
  | {
      type: "FIXED";
      fixedAmount: number;
      wholesaler: string;
      amountPaid: number;
    };

function roundToCents(x: number): number {
  return Math.round(x * 100) / 100;
}

export function amountOwedFor(
  payoutAfterFees: number,
  s: StructuredSettlement,
): number {
  if (s.type === "FIXED") return s.fixedAmount;
  return roundToCents(payoutAfterFees * (s.percent / 100));
}

function percentOrFixedDisplay(s: StructuredSettlement): string {
  if (s.type === "PERCENT") return `${s.percent}%`;
  return `$${s.fixedAmount.toFixed(2)} fixed`;
}

/** Parse server SettlementRow (percentOrFixed string + amountOwed/amountPaid) into StructuredSettlement. */
function parseSettlementRow(row: SettlementRow): StructuredSettlement {
  const trimmed = (row.percentOrFixed || "").trim();
  const percentMatch = trimmed.match(/^([\d.]+)\s*%?\s*$/);
  const fixedMatch = trimmed.match(/\$\s*([\d.]+)\s*fix/i);
  if (percentMatch) {
    const percent = Number(percentMatch[1]);
    return {
      type: "PERCENT",
      percent: Number.isNaN(percent) ? 0 : percent,
      wholesaler: row.wholesaler,
      amountPaid: row.amountPaid,
    };
  }
  if (fixedMatch) {
    const fixedAmount = Number(fixedMatch[1]);
    return {
      type: "FIXED",
      fixedAmount: Number.isNaN(fixedAmount) ? 0 : fixedAmount,
      wholesaler: row.wholesaler,
      amountPaid: row.amountPaid,
    };
  }
  // Fallback: treat as FIXED using amountOwed from row
  return {
    type: "FIXED",
    fixedAmount: row.amountOwed,
    wholesaler: row.wholesaler,
    amountPaid: row.amountPaid,
  };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function computeTotals(
  payoutAfterFees: number,
  settlements: StructuredSettlement[],
  closedAt?: string,
) {
  const totalSettlementsOwed = settlements.reduce(
    (sum, s) => sum + amountOwedFor(payoutAfterFees, s),
    0,
  );
  const totalPaid = settlements.reduce((sum, s) => sum + s.amountPaid, 0);
  const remainingToAllocate = payoutAfterFees - totalSettlementsOwed;
  const remainingToPay = totalSettlementsOwed - totalPaid;
  const estimatedProfit = payoutAfterFees - totalSettlementsOwed;
  const status = deriveStatusFromTotals(
    totalSettlementsOwed,
    totalPaid,
    settlements.length,
    closedAt,
  );
  return {
    totalSettlementsOwed,
    remainingToAllocate,
    totalPaid,
    remainingToPay,
    estimatedProfit,
    status,
  };
}

const STATUS_STYLES = {
  Draft: "bg-amber-100 text-amber-800",
  Settled: "bg-emerald-100 text-emerald-800",
  Closed: "bg-gray-100 text-gray-800",
} as const;

export function ShowDetailView({
  initialDetail,
}: {
  initialDetail: ShowDetail;
}) {
  const [payoutAfterFees, setPayoutAfterFees] = useState(
    initialDetail.payoutAfterFees,
  );
  const [settlements, setSettlements] = useState<StructuredSettlement[]>(() =>
    initialDetail.settlements.map(parseSettlementRow),
  );

  const totals = useMemo(
    () => computeTotals(payoutAfterFees, settlements, initialDetail.closedAt),
    [payoutAfterFees, initialDetail.closedAt, settlements],
  );

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddSettlement = useCallback((s: StructuredSettlement) => {
    setSettlements((prev) => [...prev, s]);
  }, []);

  const handleUpdateSettlement = useCallback(
    (index: number, s: StructuredSettlement) => {
      setSettlements((prev) => prev.map((row, i) => (i === index ? s : row)));
      setEditingIndex(null);
    },
    [],
  );

  const handleDeleteSettlement = useCallback((index: number) => {
    if (window.confirm("Delete this settlement?")) {
      setSettlements((prev) => prev.filter((_, i) => i !== index));
      setEditingIndex(null);
    }
  }, []);

  const totalPercent = useMemo(
    () =>
      settlements.reduce(
        (sum, s) => sum + (s.type === "PERCENT" ? s.percent : 0),
        0,
      ),
    [settlements],
  );

  const hasPercentSettlements = settlements.some((s) => s.type === "PERCENT");
  const percentOver100 = totalPercent > 100;
  const allocatedOverPayout = totals.remainingToAllocate < 0;
  const remainingToPayNegative = totals.remainingToPay < 0;
  const displayRemainingToPay = Math.max(0, totals.remainingToPay);

  return (
    <div>
      {/* Guardrails / workflow hints */}
      {(percentOver100 ||
        allocatedOverPayout ||
        remainingToPayNegative ||
        (payoutAfterFees === 0 && hasPercentSettlements)) && (
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-900">
            Warnings &amp; hints
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {percentOver100 && (
              <li>Total percent across PERCENT settlements is over 100%.</li>
            )}
            {allocatedOverPayout && <li>Allocated more than payout.</li>}
            {remainingToPayNegative && (
              <li>Remaining to pay was negative; shown as zero.</li>
            )}
            {payoutAfterFees === 0 && hasPercentSettlements && (
              <li>Percent settlements depend on payout.</li>
            )}
          </ul>
        </section>
      )}

      {/* Show Summary */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Show Summary
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Name
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {initialDetail.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Date
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatDate(initialDetail.date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Payout After Fees
            </dt>
            <dd className="mt-0.5">
              <EditablePayout
                value={payoutAfterFees}
                onSave={(v) => setPayoutAfterFees(v)}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total Settlements
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {settlements.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Estimated Profit
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(totals.estimatedProfit)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Derived totals & workflow */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Totals &amp; workflow
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total settlements owed
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {formatCurrency(totals.totalSettlementsOwed)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Remaining to allocate
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(totals.remainingToAllocate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Total paid
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(totals.totalPaid)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Remaining to pay
            </dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(displayRemainingToPay)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Status
            </dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[totals.status]}`}
              >
                {totals.status}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Settlements Table + Add form */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Settlements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Wholesaler
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Percent or Fixed
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Owed
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount Paid
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Balance Remaining
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
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
                settlements.map((s, i) => {
                  if (editingIndex === i) {
                    return (
                      <EditSettlementRow
                        key={i}
                        payoutAfterFees={payoutAfterFees}
                        initial={s}
                        onSave={(updated) => handleUpdateSettlement(i, updated)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    );
                  }
                  const owed = amountOwedFor(payoutAfterFees, s);
                  const balanceRemaining = owed - s.amountPaid;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {s.wholesaler}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {percentOrFixedDisplay(s)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(owed)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(s.amountPaid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(balanceRemaining)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span className="isolate inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingIndex(i)}
                            className="text-xs text-gray-600 underline hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSettlement(i)}
                            className="text-xs text-red-600 underline hover:text-red-800"
                          >
                            Delete
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AddSettlementForm
          payoutAfterFees={payoutAfterFees}
          onAdd={handleAddSettlement}
        />
      </section>
    </div>
  );
}

// --- Inline Edit Settlement Row ---

function EditSettlementRow({
  payoutAfterFees,
  initial,
  onSave,
  onCancel,
}: {
  payoutAfterFees: number;
  initial: StructuredSettlement;
  onSave: (s: StructuredSettlement) => void;
  onCancel: () => void;
}) {
  const [wholesaler, setWholesaler] = useState(initial.wholesaler);
  const [type, setType] = useState<"PERCENT" | "FIXED">(
    initial.type === "PERCENT" ? "PERCENT" : "FIXED",
  );
  const [percent, setPercent] = useState(
    initial.type === "PERCENT" ? String(initial.percent) : "",
  );
  const [fixedAmount, setFixedAmount] = useState(
    initial.type === "FIXED" ? String(initial.fixedAmount) : "",
  );
  const [amountPaid, setAmountPaid] = useState(String(initial.amountPaid));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getComputedOwed(): number | null {
    if (type === "PERCENT") {
      const p = Number(percent);
      if (percent === "" || Number.isNaN(p) || p < 0) return null;
      return roundToCents(payoutAfterFees * (p / 100));
    }
    const f = Number(fixedAmount);
    if (fixedAmount === "" || Number.isNaN(f) || f < 0) return null;
    return f;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const wholesalerTrim = wholesaler.trim();
    if (!wholesalerTrim) err.wholesaler = "Wholesaler is required";

    if (type === "PERCENT") {
      const p = Number(percent);
      if (percent === "" || Number.isNaN(p))
        err.percent = "Percent is required";
      else if (p < 0 || p > 100) err.percent = "Percent must be 0–100";
    } else {
      const f = Number(fixedAmount);
      if (fixedAmount === "" || Number.isNaN(f))
        err.fixedAmount = "Fixed amount is required";
      else if (f < 0) err.fixedAmount = "Amount must be ≥ 0";
    }

    const paid = amountPaid === "" ? NaN : Number(amountPaid);
    if (Number.isNaN(paid) || paid < 0)
      err.amountPaid = "Amount paid must be ≥ 0";

    const owed = getComputedOwed();
    if (owed !== null && paid > owed)
      err.amountPaid = "Amount paid cannot exceed amount owed";

    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const paidVal = Number(amountPaid) || 0;
    if (type === "PERCENT") {
      onSave({
        type: "PERCENT",
        percent: Number(percent),
        wholesaler: wholesalerTrim,
        amountPaid: paidVal,
      });
    } else {
      onSave({
        type: "FIXED",
        fixedAmount: Number(fixedAmount),
        wholesaler: wholesalerTrim,
        amountPaid: paidVal,
      });
    }
  }

  const computedOwed = getComputedOwed();

  return (
    <tr className="bg-gray-50">
      <td className="px-4 py-2" colSpan={6}>
        <form
          onSubmit={handleSave}
          className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-6 lg:items-end"
        >
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">
              Wholesaler <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={wholesaler}
              onChange={(e) => setWholesaler(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.wholesaler && (
              <p className="text-xs text-red-600">{errors.wholesaler}</p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          {type === "PERCENT" && (
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">
                Percent <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {errors.percent && (
                <p className="text-xs text-red-600">{errors.percent}</p>
              )}
              {computedOwed !== null && (
                <p className="text-xs text-gray-500">
                  Owed: {formatCurrency(computedOwed)}
                </p>
              )}
            </div>
          )}
          {type === "FIXED" && (
            <div>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">
                Fixed amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {errors.fixedAmount && (
                <p className="text-xs text-red-600">{errors.fixedAmount}</p>
              )}
            </div>
          )}
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">
              Amount Paid
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.amountPaid && (
              <p className="text-xs text-red-600">{errors.amountPaid}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

// --- Editable Payout After Fees ---

function EditablePayout({
  value,
  onSave,
}: {
  value: number;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setInput(String(value));
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setInput("");
    setError(null);
  }

  function save() {
    const n = Number(input);
    if (input.trim() === "" || Number.isNaN(n)) {
      setError("Enter a valid number");
      return;
    }
    if (n < 0) {
      setError("Payout must be ≥ 0");
      return;
    }
    onSave(n);
    setEditing(false);
    setInput("");
    setError(null);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900">{formatCurrency(value)}</span>
        <button
          type="button"
          onClick={startEdit}
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min="0"
        step="0.01"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        autoFocus
      />
      <button
        type="button"
        onClick={save}
        className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-800"
      >
        Save
      </button>
      <button
        type="button"
        onClick={cancel}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
      >
        Cancel
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

// --- Add Settlement form (structured: PERCENT | FIXED) ---

function AddSettlementForm({
  payoutAfterFees,
  onAdd,
}: {
  payoutAfterFees: number;
  onAdd: (s: StructuredSettlement) => void;
}) {
  const [wholesaler, setWholesaler] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [percent, setPercent] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getComputedOwed(): number | null {
    if (type === "PERCENT") {
      const p = Number(percent);
      if (percent === "" || Number.isNaN(p) || p < 0) return null;
      return roundToCents(payoutAfterFees * (p / 100));
    }
    const f = Number(fixedAmount);
    if (fixedAmount === "" || Number.isNaN(f) || f < 0) return null;
    return f;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const wholesalerTrim = wholesaler.trim();
    if (!wholesalerTrim) err.wholesaler = "Wholesaler is required";

    if (type === "PERCENT") {
      const p = Number(percent);
      if (percent === "" || Number.isNaN(p))
        err.percent = "Percent is required";
      else if (p < 0 || p > 100) err.percent = "Percent must be 0–100";
    } else {
      const f = Number(fixedAmount);
      if (fixedAmount === "" || Number.isNaN(f))
        err.fixedAmount = "Fixed amount is required";
      else if (f < 0) err.fixedAmount = "Amount must be ≥ 0";
    }

    const paid = amountPaid === "" ? NaN : Number(amountPaid);
    if (Number.isNaN(paid) || paid < 0)
      err.amountPaid = "Amount paid must be ≥ 0";

    const owed = getComputedOwed();
    if (owed !== null && paid > owed)
      err.amountPaid = "Amount paid cannot exceed amount owed";

    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const paidVal = Number(amountPaid) || 0;
    if (type === "PERCENT") {
      onAdd({
        type: "PERCENT",
        percent: Number(percent),
        wholesaler: wholesalerTrim,
        amountPaid: paidVal,
      });
    } else {
      onAdd({
        type: "FIXED",
        fixedAmount: Number(fixedAmount),
        wholesaler: wholesalerTrim,
        amountPaid: paidVal,
      });
    }

    setWholesaler("");
    setType("PERCENT");
    setPercent("");
    setFixedAmount("");
    setAmountPaid("0");
    setErrors({});
  }

  const computedOwed = getComputedOwed();

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Add Settlement
      </h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
      >
        <div>
          <label
            htmlFor="add-wholesaler"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Wholesaler <span className="text-red-500">*</span>
          </label>
          <input
            id="add-wholesaler"
            type="text"
            value={wholesaler}
            onChange={(e) => setWholesaler(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="e.g. Acme Wholesale"
          />
          {errors.wholesaler && (
            <p className="mt-0.5 text-xs text-red-600">{errors.wholesaler}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="add-type"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Type
          </label>
          <select
            id="add-type"
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
        </div>

        {type === "PERCENT" && (
          <div>
            <label
              htmlFor="add-percent"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Percent <span className="text-red-500">*</span>
            </label>
            <input
              id="add-percent"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="40"
            />
            {errors.percent && (
              <p className="mt-0.5 text-xs text-red-600">{errors.percent}</p>
            )}
            {computedOwed !== null && (
              <p className="mt-0.5 text-xs text-gray-500">
                Owed: {formatCurrency(computedOwed)}
              </p>
            )}
          </div>
        )}

        {type === "FIXED" && (
          <div>
            <label
              htmlFor="add-fixed"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Fixed amount <span className="text-red-500">*</span>
            </label>
            <input
              id="add-fixed"
              type="number"
              min="0"
              step="0.01"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="0.00"
            />
            {errors.fixedAmount && (
              <p className="mt-0.5 text-xs text-red-600">
                {errors.fixedAmount}
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="add-paid"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Amount Paid
          </label>
          <input
            id="add-paid"
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="0"
          />
          {errors.amountPaid && (
            <p className="mt-0.5 text-xs text-red-600">{errors.amountPaid}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:w-auto"
          >
            Add Settlement
          </button>
        </div>
      </form>
    </div>
  );
}
