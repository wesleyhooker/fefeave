"use client";

import { BanknotesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceFileUpload } from "@/app/(admin)/admin/_components/WorkspaceFileUpload";
import { formatCurrency } from "@/lib/format";
import {
  uploadFile,
  linkAttachmentToPayment,
  isAllowedContentType,
  getMaxUploadBytes,
} from "@/src/lib/api/attachments";
import { createPayment } from "@/src/lib/api/payments";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";
import { dispatchVendorBalancesInvalidate } from "@/lib/vendorBalancesInvalidate";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionCompleteMd,
  workspaceActionIconMd,
  workspaceActionSecondaryMd,
  workspaceCard,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";

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
            dispatchVendorBalancesInvalidate();
            router.push(`/admin/wholesalers/${wholesalerId}`);
          }, 3000);
          return;
        }
      }
      dispatchVendorBalancesInvalidate();
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
    <>
      <AdminPageIntroSection>
        <AdminPageIntro
          title="Record payment"
          subtitle="Apply a payment to a wholesaler balance."
          breadcrumb={
            <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
              <Link href="/admin/balances" className="hover:text-stone-700">
                Balances
              </Link>
              <span className="mx-1.5">/</span>
              <span aria-current="page">Record payment</span>
            </nav>
          }
        />
      </AdminPageIntroSection>

      <AdminPageContainer>
        {loadError ? (
          <WorkspaceInlineError
            title="Could not load wholesalers."
            message={loadError}
            onRetry={() => setReloadToken((v) => v + 1)}
          />
        ) : null}

        {submitError ? (
          <WorkspaceInlineError
            title="Could not record payment."
            message={submitError}
          />
        ) : null}

        <form
          onSubmit={handleSubmit}
          className={`mx-auto min-w-0 max-w-full space-y-5 p-4 sm:max-w-xl sm:space-y-4 sm:p-6 ${workspaceCard}`}
        >
          <div>
            <label
              htmlFor="wholesaler"
              className={`mb-1 block ${workspaceFormLabel}`}
            >
              Wholesaler <span className="text-red-500">*</span>
            </label>
            <WorkspaceNativeSelect
              id="wholesaler"
              required
              value={wholesalerId}
              onChange={(e) => setWholesalerId(e.target.value)}
              disabled={loadingWholesalers || wholesalers.length === 0}
            >
              <option value="">Select wholesaler</option>
              {wholesalers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </WorkspaceNativeSelect>
            {errors.wholesalerId && (
              <p className="mt-0.5 text-xs text-red-600">
                {errors.wholesalerId}
              </p>
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
                  <div className="mt-2 rounded border border-gray-200 bg-[#F9FAFB] px-3 py-2 text-sm text-gray-700">
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
                        This payment exceeds the current balance and will create
                        a credit.
                      </p>
                    )}
                  </div>
                );
              })()}
          </div>

          <div>
            <label
              htmlFor="amount"
              className={`mb-1 block ${workspaceFormLabel}`}
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
                className={`w-full min-w-0 max-w-full pl-7 tabular-nums sm:max-w-[10rem] ${workspaceTextInput}`}
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
              className={`mb-1 block ${workspaceFormLabel}`}
            >
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={workspaceDateInput}
            />
            {errors.date && (
              <p className="mt-0.5 text-xs text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="method"
              className={`mb-1 block ${workspaceFormLabelSecondary}`}
            >
              Method
            </label>
            <WorkspaceNativeSelect
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </WorkspaceNativeSelect>
          </div>

          <div>
            <label
              htmlFor="reference"
              className={`mb-1 block ${workspaceFormLabelSecondary}`}
            >
              Reference
            </label>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={workspaceTextInput}
              placeholder="Optional"
            />
          </div>

          <WorkspaceFileUpload
            id="receipt"
            label="Receipt (optional)"
            helperText={`PDF or image (PNG/JPEG), max ${MAX_MB} MB.`}
            accept={ACCEPT_RECEIPT}
            onChange={handleReceiptChange}
            error={receiptError}
            fileName={receiptFile?.name ?? null}
            tone="flush"
          />

          <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:pt-2">
            <Link
              href="/admin/balances"
              className={`${workspaceActionSecondaryMd} flex w-full justify-center sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<XMarkIcon className={workspaceActionIconMd} />}
              >
                Cancel
              </WorkspaceActionLabel>
            </Link>
            <button
              type="submit"
              disabled={submitting || loadingWholesalers}
              className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-60 sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<BanknotesIcon className={workspaceActionIconMd} />}
              >
                {submitting ? "Saving..." : "Record payment"}
              </WorkspaceActionLabel>
            </button>
          </div>
        </form>
      </AdminPageContainer>
    </>
  );
}

export default function AdminPaymentsNewPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RecordPaymentForm />
    </Suspense>
  );
}
