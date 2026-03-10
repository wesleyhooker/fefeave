"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createPayment } from "@/src/lib/api/payments";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";

const METHODS = ["Cash", "Zelle", "Venmo", "Check", "Other"] as const;

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledWholesalerId = searchParams.get("wholesalerId") ?? "";

  const [wholesalers, setWholesalers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingWholesalers, setLoadingWholesalers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const [wholesalerId, setWholesalerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("Zelle");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadingWholesalers(true);
    setLoadError(null);
    fetchWholesalerBalances()
      .then((rows) => {
        if (cancelled) return;
        setWholesalers(
          rows.map((row) => ({ id: row.wholesaler_id, name: row.name })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingWholesalers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!prefilledWholesalerId || wholesalers.length === 0) return;
    if (!wholesalers.some((w) => w.id === prefilledWholesalerId)) return;
    setWholesalerId((current) =>
      current === "" ? prefilledWholesalerId : current,
    );
  }, [prefilledWholesalerId, wholesalers]);

  function composeNotesFromMethod(
    existingNotes: string | undefined,
    selectedMethod: string,
  ): string {
    const methodText = `Method: ${selectedMethod || "Other"}`;
    if (!existingNotes?.trim()) return methodText;
    return `${existingNotes.trim()} | ${methodText}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const err: Record<string, string> = {};
    if (!date.trim()) err.date = "Date is required";
    if (!wholesalerId) err.wholesalerId = "Wholesaler is required";
    const amt = amount === "" ? NaN : Number(amount);
    if (Number.isNaN(amt) || amt <= 0) err.amount = "Amount must be > 0";
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const payload = {
      wholesaler_id: wholesalerId,
      amount: amt,
      payment_date: date.trim(),
      reference: reference.trim(),
      notes: composeNotesFromMethod(undefined, method),
    };
    setSubmitting(true);
    try {
      await createPayment(payload);
      router.push(`/admin/wholesalers/${wholesalerId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/payments"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Payments
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Record payment</h1>

      {loadError && (
        <div
          className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load wholesalers.</p>
          <p className="mt-1">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((v) => v + 1)}
            className="mt-3 rounded border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      {submitError && (
        <div
          className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not record payment.</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="wholesaler"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Wholesaler <span className="text-red-500">*</span>
          </label>
          <select
            id="wholesaler"
            required
            value={wholesalerId}
            onChange={(e) => setWholesalerId(e.target.value)}
            disabled={loadingWholesalers || wholesalers.length === 0}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Select wholesaler</option>
            {wholesalers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.wholesalerId && (
            <p className="mt-0.5 text-xs text-red-600">{errors.wholesalerId}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            id="amount"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-0.5 text-xs text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {errors.date && (
            <p className="mt-0.5 text-xs text-red-600">{errors.date}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="method"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="reference"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reference
          </label>
          <input
            id="reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Optional"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || loadingWholesalers}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {submitting ? "Saving..." : "Record payment"}
          </button>
          <Link
            href="/admin/payments"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function AdminPaymentsNewPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RecordPaymentForm />
    </Suspense>
  );
}
