"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getWholesalers, createPayment } from "@/lib/ledgerMock";

const METHODS = ["Cash", "Zelle", "Venmo", "Check", "Other"] as const;

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledWholesalerId = searchParams.get("wholesalerId") ?? "";

  const wholesalers = getWholesalers();
  const [date, setDate] = useState("");
  const [wholesalerId, setWholesalerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("Zelle");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (
      prefilledWholesalerId &&
      wholesalers.some((w) => w.id === prefilledWholesalerId)
    ) {
      setWholesalerId(prefilledWholesalerId);
    }
  }, [prefilledWholesalerId, wholesalers]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!date.trim()) err.date = "Date is required";
    if (!wholesalerId) err.wholesalerId = "Wholesaler is required";
    const amt = amount === "" ? NaN : Number(amount);
    if (Number.isNaN(amt) || amt < 0) err.amount = "Amount must be ≥ 0";
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const payload = {
      date: date.trim(),
      wholesalerId,
      amount: amt,
      method: method || "Other",
      reference: reference.trim(),
    };
    createPayment(payload);
    router.push(`/admin/wholesalers/${wholesalerId}`);
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Record Payment</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
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
            min="0"
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
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Record Payment
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
