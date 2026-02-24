"use client";

import { useState, useMemo } from "react";
import type { ShowDetail, SettlementRow } from "@/lib/mockData";
import { deriveStatusFromSettlements } from "@/lib/mockData";

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
  settlements: SettlementRow[],
  closedAt?: string,
) {
  const totalSettlementsOwed = settlements.reduce(
    (s, r) => s + r.amountOwed,
    0,
  );
  const totalPaid = settlements.reduce((s, r) => s + r.amountPaid, 0);
  const remainingToAllocate = payoutAfterFees - totalSettlementsOwed;
  const remainingToPay = totalSettlementsOwed - totalPaid;
  const estimatedProfit = payoutAfterFees - totalSettlementsOwed;
  const status = deriveStatusFromSettlements(settlements, closedAt);
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
  const [settlements, setSettlements] = useState<SettlementRow[]>(
    initialDetail.settlements,
  );

  const totals = useMemo(
    () =>
      computeTotals(
        initialDetail.payoutAfterFees,
        settlements,
        initialDetail.closedAt,
      ),
    [initialDetail.payoutAfterFees, initialDetail.closedAt, settlements],
  );

  return (
    <div>
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
            <dd className="mt-0.5 text-sm text-gray-900">
              {formatCurrency(initialDetail.payoutAfterFees)}
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
              {formatCurrency(totals.remainingToPay)}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {settlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                settlements.map((row, i) => {
                  const balanceRemaining = row.amountOwed - row.amountPaid;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {row.wholesaler}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {row.percentOrFixed}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(row.amountOwed)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(row.amountPaid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {formatCurrency(balanceRemaining)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AddSettlementForm
          onAdd={(row) => setSettlements((prev) => [...prev, row])}
        />
      </section>
    </div>
  );
}

// --- Add Settlement inline form ---

type SettlementType = "Percent" | "Fixed";

function AddSettlementForm({ onAdd }: { onAdd: (row: SettlementRow) => void }) {
  const [wholesaler, setWholesaler] = useState("");
  const [type, setType] = useState<SettlementType>("Percent");
  const [percentValue, setPercentValue] = useState("");
  const [amountOwed, setAmountOwed] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const wholesalerTrim = wholesaler.trim();
    if (!wholesalerTrim) err.wholesaler = "Wholesaler is required";
    const owed = amountOwed === "" ? NaN : Number(amountOwed);
    const paid = amountPaid === "" ? NaN : Number(amountPaid);
    if (Number.isNaN(owed) || owed < 0)
      err.amountOwed = "Amount owed must be ≥ 0";
    if (Number.isNaN(paid) || paid < 0)
      err.amountPaid = "Amount paid must be ≥ 0";
    if (owed >= 0 && paid >= 0 && paid > owed)
      err.amountPaid = "Amount paid cannot exceed amount owed";

    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const percentOrFixed =
      type === "Percent"
        ? `${percentValue || "0"}%`
        : `$${owed.toFixed(2)} fixed`;

    onAdd({
      wholesaler: wholesalerTrim,
      percentOrFixed,
      amountOwed: owed,
      amountPaid: paid,
    });

    setWholesaler("");
    setType("Percent");
    setPercentValue("");
    setAmountOwed("");
    setAmountPaid("0");
    setErrors({});
  }

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
            onChange={(e) => setType(e.target.value as SettlementType)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="Percent">Percent</option>
            <option value="Fixed">Fixed</option>
          </select>
        </div>

        {type === "Percent" && (
          <div>
            <label
              htmlFor="add-percent"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Percent value
            </label>
            <input
              id="add-percent"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={percentValue}
              onChange={(e) => setPercentValue(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="40"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="add-owed"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Amount Owed <span className="text-red-500">*</span>
          </label>
          <input
            id="add-owed"
            type="number"
            min="0"
            step="0.01"
            value={amountOwed}
            onChange={(e) => setAmountOwed(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="0.00"
          />
          {errors.amountOwed && (
            <p className="mt-0.5 text-xs text-red-600">{errors.amountOwed}</p>
          )}
        </div>

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
