"use client";

import {
  BanknotesIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  createPayment,
  deletePayment,
  paymentMethodFromNotes,
  updatePayment,
  type PaymentDTO,
} from "@/src/lib/api/payments";
import {
  uploadFile,
  linkAttachmentToPayment,
  isAllowedContentType,
  getMaxUploadBytes,
  fetchPaymentAttachments,
} from "@/src/lib/api/attachments";
import { WorkspaceFileUpload } from "@/app/(admin)/admin/_components/WorkspaceFileUpload";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import { WorkspaceSelectMenu } from "@/app/(admin)/admin/_components/WorkspaceSelectMenu";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionIconMd,
  workspaceActionPositiveCompleteMd,
  workspaceActionSecondaryMd,
  workspaceCard,
  workspaceDateInput,
  workspaceDateInputCompact,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspacePanel,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceTextInput,
  workspaceTextInputCompact,
} from "@/app/(admin)/admin/_components/workspaceUi";

const METHOD_OPTIONS = (
  ["Cash", "Zelle", "Venmo", "Check", "Other"] as const
).map((m) => ({ value: m, label: m }));

const ACCEPT_RECEIPT = ".pdf,image/png,image/jpeg,image/jpg";
const MAX_MB = Math.round(getMaxUploadBytes() / 1024 / 1024);

function composeNotesFromMethod(
  existingNotes: string | undefined,
  selectedMethod: string,
): string {
  const methodText = `Method: ${selectedMethod || "Other"}`;
  if (!existingNotes?.trim()) return methodText;
  return `${existingNotes.trim()} | ${methodText}`;
}

function formatBalanceForInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return (Math.round(n * 100) / 100).toFixed(2);
}

export type WholesalerPayFormMode = "create" | "edit";

export function WholesalerInlinePaySection({
  wholesalerId,
  currentBalance,
  mode,
  editPayment,
  onCancelEdit,
  onRecorded,
  density = "default",
}: {
  wholesalerId: string;
  currentBalance: number;
  mode: WholesalerPayFormMode;
  editPayment: PaymentDTO | null;
  onCancelEdit: () => void;
  onRecorded: () => void;
  density?: "default" | "compact";
}) {
  const isCompact = density === "compact";
  const textField = isCompact ? workspaceTextInputCompact : workspaceTextInput;
  const dateField = isCompact ? workspaceDateInputCompact : workspaceDateInput;
  const primaryFieldShell = `${workspacePanel} ${
    isCompact ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"
  }`;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("Zelle");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceipts, setExistingReceipts] = useState<
    { id: string; filename: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [amountHighlight, setAmountHighlight] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!amountHighlight) return;
    const id = window.setTimeout(() => setAmountHighlight(false), 700);
    return () => window.clearTimeout(id);
  }, [amountHighlight]);

  useEffect(() => {
    if (mode === "edit" && editPayment) {
      const amt = parseFloat(String(editPayment.amount));
      setAmount(Number.isFinite(amt) ? amt.toFixed(2) : "");
      setMethod(paymentMethodFromNotes(editPayment.notes));
      setNote(editPayment.reference ?? "");
      setDate(editPayment.payment_date);
      setReceiptFile(null);
      setReceiptError(null);
      void fetchPaymentAttachments(editPayment.id)
        .then((list) =>
          setExistingReceipts(
            list.map((a) => ({ id: a.id, filename: a.filename })),
          ),
        )
        .catch(() => setExistingReceipts([]));
    }
  }, [mode, editPayment?.id]);

  useEffect(() => {
    if (mode === "create" && !editPayment) {
      setAmount("");
      setMethod("Zelle");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setReceiptFile(null);
      setExistingReceipts([]);
      setReceiptError(null);
      setSubmitError(null);
      setFieldErrors({});
    }
  }, [mode, editPayment]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setReceiptError(null);
    const err: Record<string, string> = {};
    if (!date.trim()) err.date = "Date is required";
    const amt = amount === "" ? NaN : Number(amount);
    if (Number.isNaN(amt) || amt <= 0)
      err.amount = "Amount must be greater than 0";
    setFieldErrors(err);
    if (Object.keys(err).length > 0) return;

    const notesPayload = composeNotesFromMethod(undefined, method);
    const refPayload = note.trim() || undefined;

    setSubmitting(true);
    try {
      if (mode === "edit" && editPayment) {
        await updatePayment(editPayment.id, {
          amount: amt,
          payment_date: date.trim(),
          reference: refPayload,
          notes: notesPayload,
        });

        if (receiptFile) {
          try {
            const attachmentId = await uploadFile(receiptFile);
            await linkAttachmentToPayment(editPayment.id, attachmentId);
          } catch (attachErr) {
            const msg =
              attachErr instanceof Error
                ? attachErr.message
                : String(attachErr);
            setReceiptError(
              `Payment saved. Receipt upload failed: ${msg}. Refreshing…`,
            );
          }
        }
        onCancelEdit();
      } else {
        const payment = await createPayment({
          wholesaler_id: wholesalerId,
          amount: amt,
          payment_date: date.trim(),
          reference: refPayload,
          notes: notesPayload,
        });

        if (receiptFile) {
          try {
            const attachmentId = await uploadFile(receiptFile);
            await linkAttachmentToPayment(payment.id, attachmentId);
          } catch (attachErr) {
            const msg =
              attachErr instanceof Error
                ? attachErr.message
                : String(attachErr);
            setReceiptError(
              `Payment saved. Receipt upload failed: ${msg}. Refreshing vendor data…`,
            );
          }
        }

        setAmount("");
        setNote("");
        setReceiptFile(null);
        const fileInput = document.getElementById(
          "wholesaler-inline-receipt",
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
      }

      onRecorded();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!editPayment) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await deletePayment(editPayment.id);
      onCancelEdit();
      onRecorded();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSubmitError(msg);
      throw error;
    } finally {
      setDeleting(false);
    }
  }

  const amtNum = amount === "" ? NaN : Number(amount);
  const validAmount = Number.isFinite(amtNum) && amtNum > 0;
  const projected =
    mode === "create" && validAmount && Number.isFinite(currentBalance)
      ? Math.round((currentBalance - amtNum) * 100) / 100
      : null;
  const isOverage = mode === "create" && validAmount && amtNum > currentBalance;

  const formStack = isCompact ? "space-y-4" : "space-y-6";
  const formPadding = isCompact
    ? "px-3.5 pb-4 pt-3 sm:px-5 sm:pb-5"
    : "px-4 pb-5 pt-4 sm:px-6 sm:pb-6";
  const primaryRowGrid = isCompact
    ? "grid gap-4 sm:gap-4 lg:grid-cols-2 lg:items-start"
    : "grid gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start";
  const secondaryRowGrid = isCompact
    ? "grid gap-3 border-t border-gray-200/90 pt-3.5 sm:grid-cols-2 sm:items-start sm:gap-4"
    : "grid gap-4 border-t border-gray-200/90 pt-5 sm:grid-cols-2 sm:items-start sm:gap-5";
  const tertiaryBlock = isCompact
    ? "border-t border-gray-200/90 pt-3.5"
    : "border-t border-gray-200/90 pt-5";
  const footerBlockCreate = isCompact
    ? "flex flex-wrap items-center gap-2.5 border-t border-gray-200/90 pt-3.5"
    : "flex flex-wrap items-center gap-3 border-t border-gray-200/90 pt-5";
  const footerBlockEdit =
    "flex flex-col-reverse gap-3 border-t border-gray-200/90 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

  const isEdit = mode === "edit" && editPayment;

  return (
    <section
      id="vendor-inline-payment"
      className={`min-w-0 overflow-hidden ${workspaceCard}`}
      aria-labelledby="wholesaler-pay-heading"
    >
      <div className={workspaceSectionToolbar}>
        <div className="flex w-full min-w-0 items-center justify-between gap-3">
          <h2 id="wholesaler-pay-heading" className={workspaceSectionTitle}>
            {isEdit ? "Edit payment" : "Make payment"}
          </h2>
          {isEdit ? (
            <button
              type="button"
              className={`${workspaceActionSecondaryMd} shrink-0 text-sm`}
              onClick={onCancelEdit}
            >
              <WorkspaceActionLabel
                icon={<XMarkIcon className={workspaceActionIconMd} />}
              >
                Cancel edit
              </WorkspaceActionLabel>
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`${formStack} ${formPadding}`}>
        {submitError ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <p className="font-medium">Could not save payment.</p>
            <p className="mt-1">{submitError}</p>
          </div>
        ) : null}

        <div className={primaryRowGrid}>
          <div className={primaryFieldShell}>
            <label
              htmlFor="wholesaler-pay-amount"
              className={`${workspaceFormLabel} block`}
            >
              Amount <span className="text-red-500">*</span>
            </label>
            <div className={isCompact ? "mt-1.5 max-w-xs" : "mt-2 max-w-xs"}>
              <div className="relative">
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-gray-500 ${isCompact ? "left-2.5" : "left-3"}`}
                  aria-hidden
                >
                  $
                </span>
                <input
                  ref={amountInputRef}
                  id="wholesaler-pay-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    const parts = v.split(".");
                    if (parts.length > 2) return;
                    if (parts[1]?.length > 2) return;
                    setAmount(v);
                  }}
                  className={`${textField} w-full ${isCompact ? "pl-6" : "pl-7"} tabular-nums transition-[box-shadow,border-color] duration-200 ${
                    amountHighlight
                      ? "border-emerald-500/50 ring-2 ring-emerald-200/70 ring-offset-1 ring-offset-white"
                      : ""
                  }`}
                  placeholder="0.00"
                  aria-label="Payment amount in dollars"
                />
              </div>
              {!isEdit ? (
                <div
                  className={
                    isCompact
                      ? "mt-1.5 border-t border-dashed border-gray-200/90 pt-1.5"
                      : "mt-2 border-t border-dashed border-gray-200/90 pt-2"
                  }
                >
                  <button
                    type="button"
                    className="text-left text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
                    onClick={() => {
                      setAmount(formatBalanceForInput(currentBalance));
                      setAmountHighlight(true);
                      queueMicrotask(() => amountInputRef.current?.focus());
                    }}
                  >
                    Pay full amount
                  </button>
                </div>
              ) : null}
            </div>
            {fieldErrors.amount ? (
              <p className="mt-2 text-xs text-red-600">{fieldErrors.amount}</p>
            ) : null}
            {!isEdit && validAmount ? (
              <div
                className={
                  isCompact
                    ? "mt-2 rounded-md border border-gray-200/90 bg-gray-50/90 px-2.5 py-1.5 text-xs text-gray-800"
                    : "mt-3 rounded-md border border-gray-200/90 bg-gray-50/90 px-3 py-2 text-xs text-gray-800"
                }
              >
                <p>
                  Balance before:{" "}
                  <span className="font-medium text-stone-900">
                    {formatCurrency(currentBalance)}
                  </span>
                </p>
                {projected !== null ? (
                  <p className="mt-1">
                    After this payment:{" "}
                    <span className="font-medium text-stone-900">
                      {formatCurrency(projected)}
                    </span>
                  </p>
                ) : null}
                {isOverage ? (
                  <p className="mt-2 text-amber-800" role="status">
                    This amount exceeds the current balance and will create a
                    credit.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={primaryFieldShell}>
            <label
              htmlFor="wholesaler-pay-method-trigger"
              className={`${workspaceFormLabel} block`}
            >
              Payment method
            </label>
            <div className={isCompact ? "mt-1.5" : "mt-2"}>
              <WorkspaceSelectMenu
                id="wholesaler-pay-method"
                value={method}
                onChange={setMethod}
                options={METHOD_OPTIONS}
                ariaLabel="Payment method"
                align="left"
              />
            </div>
          </div>
        </div>

        <div className={secondaryRowGrid}>
          <div className="min-w-0">
            <label
              htmlFor="wholesaler-pay-note"
              className={`${workspaceFormLabelSecondary} block`}
            >
              Note (optional)
            </label>
            <input
              id="wholesaler-pay-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${textField} ${isCompact ? "mt-1" : "mt-1.5"}`}
              placeholder="Add a short note"
              autoComplete="off"
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="wholesaler-pay-date"
              className={`${workspaceFormLabelSecondary} block`}
            >
              Payment date
            </label>
            <input
              id="wholesaler-pay-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${dateField} ${isCompact ? "mt-1" : "mt-1.5"}`}
            />
            {fieldErrors.date ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
            ) : null}
          </div>
        </div>

        <div className={tertiaryBlock}>
          <WorkspaceFileUpload
            id="wholesaler-inline-receipt"
            label={
              <>
                Receipt{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </>
            }
            helperText={`PDF or image (PNG/JPEG), max ${MAX_MB} MB.${
              isEdit && existingReceipts.length > 0
                ? ` Current: ${existingReceipts.map((r) => r.filename).join(", ")}.`
                : ""
            }`}
            accept={ACCEPT_RECEIPT}
            onChange={handleReceiptChange}
            error={receiptError}
            fileName={
              receiptFile && !receiptError?.startsWith("Payment saved")
                ? receiptFile.name
                : null
            }
          />
        </div>

        {isEdit ? (
          <div className={footerBlockEdit}>
            <button
              type="button"
              className={`${workspaceActionSecondaryMd} border-red-200/90 text-red-800 hover:border-red-300 hover:bg-red-50/80`}
              onClick={() => setDeleteOpen(true)}
              disabled={submitting || deleting}
            >
              <WorkspaceActionLabel
                icon={<TrashIcon className={workspaceActionIconMd} />}
              >
                Delete payment
              </WorkspaceActionLabel>
            </button>
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`${workspaceActionPositiveCompleteMd} min-w-[10rem] w-full sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<CheckIcon className={workspaceActionIconMd} />}
              >
                {submitting ? "Saving…" : "Save changes"}
              </WorkspaceActionLabel>
            </button>
          </div>
        ) : (
          <div className={footerBlockCreate}>
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`${workspaceActionPositiveCompleteMd} min-w-[11rem]`}
            >
              <WorkspaceActionLabel
                icon={<BanknotesIcon className={workspaceActionIconMd} />}
              >
                {submitting ? "Saving…" : "Record payment"}
              </WorkspaceActionLabel>
            </button>
          </div>
        )}
      </form>

      <WorkspaceConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        icon="×"
        title="Delete this payment?"
        description="This removes the payment from the ledger. You can record a new payment later if needed."
        confirmLabel={deleting ? "Deleting…" : "Delete payment"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
