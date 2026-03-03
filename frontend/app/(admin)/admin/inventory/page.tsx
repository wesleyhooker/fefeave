"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchInventoryPurchases,
  createInventoryPurchase,
  type InventoryPurchaseDTO,
} from "@/src/lib/api/inventory-purchases";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminInventoryPage() {
  const [purchases, setPurchases] = useState<InventoryPurchaseDTO[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [purchaseDate, setPurchaseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInventoryPurchases(30)
      .then((rows) => {
        if (!cancelled) setPurchases(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setPurchases([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amt = amount === "" ? NaN : Number(amount);
    if (!purchaseDate.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setSubmitError("Amount must be greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await createInventoryPurchase({
        purchase_date: purchaseDate.trim(),
        amount: amt,
        notes: notes.trim() || undefined,
      });
      setPurchaseDate("");
      setAmount("");
      setNotes("");
      setReloadToken((t) => t + 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Inventory purchases
      </h1>
      <p className="mb-6 text-gray-600">
        Record pallet or lump-sum inventory buys (cash-based, no SKU).
      </p>

      <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Add purchase
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Date</span>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Amount ($)</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Notes (optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pallet #3"
              className="min-w-[12rem] rounded border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Add"}
            </button>
          </div>
        </form>
        {submitError && (
          <p className="mt-3 text-sm text-amber-700" role="alert">
            {submitError}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent purchases (last 30 days)
          </h2>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="px-4 py-4 text-sm text-amber-700" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setReloadToken((t) => t + 1)}
              className="ml-3 text-gray-700 underline"
            >
              Retry
            </button>
          </div>
        ) : !purchases?.length ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No purchases in the last 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {purchases.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {formatDate(row.purchase_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(parseAmount(row.amount))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
