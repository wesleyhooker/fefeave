"use client";

import { BanknotesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminEntityBreadcrumb } from "@/app/(admin)/admin/_components/AdminEntityBreadcrumb";
import { BALANCES_PAGE_BREADCRUMB } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
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
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionCompleteMd,
  workspaceActionIconMd,
  workspaceActionSecondaryMd,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceTextInput,
} from "@/app/(admin)/admin/_components/workspaceUi";

const METHODS = ["Cash", "Zelle", "Venmo", "Check", "Other"] as const;
const ACCEPT_RECEIPT = ".pdf,image/png,image/jpeg,image/jpg";
const MAX_MB = Math.round(getMaxUploadBytes() / 1024 / 1024);

export function RecordPaymentPageContent({
  initialVendorId = "",
  lockVendor = false,
}: {
  initialVendorId?: string;
  lockVendor?: boolean;
}) {
  const router = useRouter();
  const prefilledVendorId = initialVendorId;

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
    if (!prefilledVendorId || wholesalers.length === 0) return;
    if (!wholesalers.some((w) => w.id === prefilledVendorId)) return;
    setWholesalerId((current) =>
      current === "" ? prefilledVendorId : current,
    );
  }, [prefilledVendorId, wholesalers]);

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
    if (!wholesalerId) err.wholesalerId = "Vendor is required";
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
            router.push(vendorDetailHref(wholesalerId));
          }, 3000);
          return;
        }
      }
      dispatchVendorBalancesInvalidate();
      router.push(vendorDetailHref(wholesalerId));
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
    <AdminWorkspacePageLayout
      containerTier="compact"
      intro={
        <AdminWorkspacePageIntro
          title="Record payment"
          subtitle="Apply a payment to a vendor balance."
          breadcrumb={
            <AdminEntityBreadcrumb
              variant="compact"
              segments={
                lockVendor && prefilledVendorId
                  ? [
                      BALANCES_PAGE_BREADCRUMB,
                      {
                        href: vendorDetailHref(prefilledVendorId),
                        label:
                          wholesalers.find((w) => w.id === prefilledVendorId)
                            ?.name ?? "Vendor",
                      },
                      { label: "Record payment", current: true },
                    ]
                  : [
                      BALANCES_PAGE_BREADCRUMB,
                      { label: "Record payment", current: true },
                    ]
              }
            />
          }
        />
      }
    >
      <WorkspaceGrid variant="stack">
        {loadError ? (
          <WorkspaceGridItem span="full">
            <WorkspaceInlineError
              title="Could not load vendors."
              message={loadError}
              onRetry={() => setReloadToken((v) => v + 1)}
            />
          </WorkspaceGridItem>
        ) : null}

        {submitError ? (
          <WorkspaceGridItem span="full">
            <WorkspaceInlineError
              title="Could not record payment."
              message={submitError}
            />
          </WorkspaceGridItem>
        ) : null}

        <WorkspaceGridItem span="full">
          <WorkspaceCard className="mx-auto min-w-0 max-w-full sm:max-w-xl">
            <WorkspaceCardBody>
              <form
                onSubmit={handleSubmit}
                className="flex min-w-0 flex-col space-y-5 sm:space-y-4"
              >
                <div>
                  <label
                    htmlFor="wholesaler"
                    className={`mb-1 block ${workspaceFormLabel}`}
                  >
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <WorkspaceNativeSelect
                    id="wholesaler"
                    required
                    value={wholesalerId}
                    onChange={(e) => setWholesalerId(e.target.value)}
                    disabled={
                      lockVendor ||
                      loadingWholesalers ||
                      wholesalers.length === 0
                    }
                  >
                    <option value="">Select vendor</option>
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
                        <div className="mt-2 rounded border border-gray-200 bg-admin-mutedStrip/90 px-3 py-2 text-sm text-gray-700">
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
                              This payment exceeds the current balance and will
                              create a credit.
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
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.amount}
                    </p>
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
                    href={
                      wholesalerId
                        ? vendorDetailHref(wholesalerId)
                        : BALANCES_PAGE_BREADCRUMB.href
                    }
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
            </WorkspaceCardBody>
          </WorkspaceCard>
        </WorkspaceGridItem>
      </WorkspaceGrid>
    </AdminWorkspacePageLayout>
  );
}
