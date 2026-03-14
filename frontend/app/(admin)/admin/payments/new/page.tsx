"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { formatCurrency } from "@/lib/format";
import {
  uploadFile,
  linkAttachmentToPayment,
  isAllowedContentType,
  getMaxUploadBytes,
} from "@/src/lib/api/attachments";
import { createPayment } from "@/src/lib/api/payments";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";

const METHODS = ["Cash", "Zelle", "Venmo", "Check", "Other"] as const;
const ACCEPT_RECEIPT = ".pdf,image/png,image/jpeg,image/jpg";
const MAX_MB = Math.round(getMaxUploadBytes() / 1024 / 1024);

function RecordPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledWholesalerId = searchParams.get("wholesalerId") ?? "";

  const [wholesalers, setWholesalers] = useState<
    Array<{ id: string; name: string; balanceOwed: number }>
  >([]);
  const [loadingWholesalers, setLoadingWholesalers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [wholesalerId, setWholesalerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("Zelle");
  const [reference, setReference] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
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
          rows.map((row) => ({
            id: row.wholesaler_id,
            name: row.name,
            balanceOwed: (() => {
              const n = Number(row.balance_owed);
              return Number.isFinite(n) ? n : 0;
            })(),
          })),
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
    setSubmitError(null);
    setReceiptError(null);
    try {
      const payment = await createPayment(payload);
      if (receiptFile) {
        try {
          const attachmentId = await uploadFile(receiptFile);
          await linkAttachmentToPayment(payment.id, attachmentId);
        } catch (attachErr) {
          const msg =
            attachErr instanceof Error ? attachErr.message : String(attachErr);
          setReceiptError(
            `Payment saved. Receipt upload failed: ${msg}. Redirecting…`,
          );
          setTimeout(() => {
            router.push(`/admin/wholesalers/${wholesalerId}`);
          }, 3000);
          return;
        }
      }
      router.push(`/admin/wholesalers/${wholesalerId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    setReceiptError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }
    if (!isAllowedContentType(file.type)) {
      setReceiptError("Use PDF or image (PNG/JPEG).");
      setReceiptFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > getMaxUploadBytes()) {
      setReceiptError(`File must be under ${MAX_MB} MB.`);
      setReceiptFile(null);
      e.target.value = "";
      return;
    }
    setReceiptFile(file);
  }

  return (
    <div>
      <nav className="mb-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/admin/payments" className="hover:text-gray-700">
          Payments
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page">Record payment</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Record payment</h1>

      {loadError && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
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
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
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
          {wholesalerId &&
            (() => {
              const w = wholesalers.find((x) => x.id === wholesalerId);
              if (!w) return null;
              const amt = amount === "" ? NaN : Number(amount);
              const validAmount = Number.isFinite(amt) && amt > 0;
              const projected = validAmount
                ? Math.round((w.balanceOwed - amt) * 100) / 100
                : null;
              const isOverage = validAmount && amt > w.balanceOwed;
              return (
                <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <p>
                    Current balance owed:{" "}
                    <strong className="text-gray-900">
                      {formatCurrency(w.balanceOwed)}
                    </strong>
                  </p>
                  {projected !== null && (
                    <p className="mt-1">
                      After this payment:{" "}
                      <strong className="text-gray-900">
                        {formatCurrency(projected)}
                      </strong>
                    </p>
                  )}
                  {isOverage && (
                    <p className="mt-2 text-amber-700" role="alert">
                      This payment exceeds the current balance and will create a
                      credit.
                    </p>
                  )}
                </div>
              );
            })()}
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              aria-hidden
            >
              $
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                const parts = v.split(".");
                if (parts.length > 2) return;
                if (parts[1]?.length > 2) return;
                setAmount(v);
              }}
              className="w-full max-w-[8rem] rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm tabular-nums shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="0.00"
              aria-label="Amount in dollars"
            />
          </div>
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

        <div>
          <label
            htmlFor="receipt"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Receipt (optional)
          </label>
          <p className="mb-2 text-xs text-gray-500">
            PDF or image (PNG/JPEG), max {MAX_MB} MB.
          </p>
          <input
            id="receipt"
            type="file"
            accept={ACCEPT_RECEIPT}
            onChange={handleReceiptChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            aria-describedby={
              receiptError
                ? "receipt-error"
                : receiptFile
                  ? "receipt-name"
                  : undefined
            }
          />
          {receiptError && (
            <p
              id="receipt-error"
              role="alert"
              className={
                receiptError.startsWith("Payment saved")
                  ? "mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                  : "mt-2 text-xs text-red-600"
              }
            >
              {receiptError}
            </p>
          )}
          {receiptFile && !receiptError && (
            <p id="receipt-name" className="mt-2 text-xs text-gray-600">
              {receiptFile.name}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || loadingWholesalers}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Record payment"}
          </button>
          <Link
            href="/admin/payments"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
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
