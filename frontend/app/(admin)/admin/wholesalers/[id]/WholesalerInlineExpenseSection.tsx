"use client";

import {
  CheckIcon,
  DocumentTextIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  createVendorExpense,
  deleteVendorExpense,
  updateVendorExpense,
} from "@/src/lib/api/vendor-expenses";
import {
  uploadFile,
  linkAttachmentToOwedLineItem,
  isAllowedContentType,
  getMaxUploadBytes,
  fetchOwedLineItemAttachments,
} from "@/src/lib/api/attachments";
import { WorkspaceFileUpload } from "@/app/(admin)/admin/_components/WorkspaceFileUpload";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
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

const ACCEPT_RECEIPT = ".pdf,image/png,image/jpeg,image/jpg";
const MAX_MB = Math.round(getMaxUploadBytes() / 1024 / 1024);

export type VendorExpenseEditDraft = {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
};

export type WholesalerExpenseFormMode = "create" | "edit";

export function WholesalerInlineExpenseSection({
  wholesalerId,
  currentBalance,
  mode,
  editExpense,
  onCancelEdit,
  onRecorded,
  density = "default",
  embedded = false,
}: {
  wholesalerId: string;
  currentBalance: number;
  mode: WholesalerExpenseFormMode;
  editExpense: VendorExpenseEditDraft | null;
  onCancelEdit: () => void;
  onRecorded: () => void;
  density?: "default" | "compact";
  embedded?: boolean;
}) {
  const isCompact = density === "compact";
  const textField = isCompact ? workspaceTextInputCompact : workspaceTextInput;
  const dateField = isCompact ? workspaceDateInputCompact : workspaceDateInput;
  const primaryFieldShell = `${workspacePanel} ${
    isCompact ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"
  }`;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceipts, setExistingReceipts] = useState<
    { id: string; filename: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && editExpense) {
      setAmount(editExpense.amount.toFixed(2));
      setDescription(editExpense.description);
      setDate(editExpense.expense_date);
      setReceiptFile(null);
      setReceiptError(null);
      void fetchOwedLineItemAttachments(editExpense.id)
        .then((list) =>
          setExistingReceipts(
            list.map((a) => ({ id: a.id, filename: a.filename })),
          ),
        )
        .catch(() => setExistingReceipts([]));
    }
  }, [mode, editExpense?.id]);

  useEffect(() => {
    if (mode === "create" && !editExpense) {
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setReceiptFile(null);
      setExistingReceipts([]);
      setReceiptError(null);
      setSubmitError(null);
      setFieldErrors({});
    }
  }, [mode, editExpense?.id]);

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
    const desc = description.trim();
    if (!desc) err.description = "Description is required";
    setFieldErrors(err);
    if (Object.keys(err).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === "edit" && editExpense) {
        await updateVendorExpense(wholesalerId, editExpense.id, {
          amount: amt,
          description: desc,
          expense_date: date.trim(),
        });
        if (receiptFile) {
          try {
            const attachmentId = await uploadFile(receiptFile);
            await linkAttachmentToOwedLineItem(editExpense.id, attachmentId);
          } catch (attachErr) {
            const msg =
              attachErr instanceof Error
                ? attachErr.message
                : String(attachErr);
            setReceiptError(
              `Expense saved. Receipt upload failed: ${msg}. Refreshing…`,
            );
          }
        }
        onCancelEdit();
      } else {
        const created = await createVendorExpense(wholesalerId, {
          amount: amt,
          description: desc,
          expense_date: date.trim(),
        });
        if (receiptFile) {
          try {
            const attachmentId = await uploadFile(receiptFile);
            await linkAttachmentToOwedLineItem(created.id, attachmentId);
          } catch (attachErr) {
            const msg =
              attachErr instanceof Error
                ? attachErr.message
                : String(attachErr);
            setReceiptError(
              `Expense saved. Receipt upload failed: ${msg}. Refreshing vendor data…`,
            );
          }
        }
        setAmount("");
        setDescription("");
        setReceiptFile(null);
        const fileInput = document.getElementById(
          "wholesaler-inline-expense-receipt",
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
    if (!editExpense) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await deleteVendorExpense(wholesalerId, editExpense.id);
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
      ? Math.round((currentBalance + amtNum) * 100) / 100
      : null;

  const formStack =
    isCompact && embedded
      ? "space-y-2.5"
      : isCompact
        ? "space-y-4"
        : "space-y-6";
  const formPadding = embedded
    ? isCompact
      ? "px-3.5 pb-3.5 pt-2 sm:px-5 sm:pb-4"
      : "px-4 pb-5 pt-3 sm:px-6 sm:pb-6"
    : isCompact
      ? "px-3.5 pb-4 pt-3 sm:px-5 sm:pb-5"
      : "px-4 pb-5 pt-4 sm:px-6 sm:pb-6";
  const primaryRowGrid =
    isCompact && embedded
      ? "grid gap-3.5 sm:gap-4 lg:grid-cols-2 lg:items-start"
      : isCompact
        ? "grid gap-4 sm:gap-4 lg:grid-cols-2 lg:items-start"
        : "grid gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start";
  const secondaryRowGrid =
    isCompact && embedded
      ? "grid gap-3 border-t border-gray-200/60 pt-2 sm:grid-cols-2 sm:items-start sm:gap-4"
      : isCompact
        ? "grid gap-3 border-t border-gray-200/90 pt-3 sm:grid-cols-2 sm:items-start sm:gap-4"
        : "grid gap-4 border-t border-gray-200/90 pt-5 sm:grid-cols-2 sm:items-start sm:gap-5";
  const tertiaryBlock =
    isCompact && embedded
      ? "border-t border-gray-200/55 pt-2"
      : isCompact
        ? "border-t border-gray-200/90 pt-3"
        : "border-t border-gray-200/90 pt-5";
  const footerBlockCreate =
    isCompact && embedded
      ? "flex flex-wrap items-center gap-2 border-t border-gray-200/60 pt-2.5"
      : isCompact
        ? "flex flex-wrap items-center gap-2.5 border-t border-gray-200/90 pt-3"
        : "flex flex-wrap items-center gap-3 border-t border-gray-200/90 pt-5";
  const footerBlockEdit =
    "flex flex-col-reverse gap-3 border-t border-gray-200/90 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

  const isEdit = mode === "edit" && editExpense;

  const headerBlock = embedded ? (
    isEdit ? (
      <div className="flex justify-end border-b border-gray-200/50 bg-gray-50/40 px-4 py-2 sm:px-5">
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
      </div>
    ) : null
  ) : (
    <div className={workspaceSectionToolbar}>
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <h2 id="wholesaler-expense-heading" className={workspaceSectionTitle}>
          {isEdit ? "Edit expense" : "Add expense"}
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
  );

  const outerClass = embedded
    ? "min-w-0"
    : `min-w-0 overflow-hidden ${workspaceCard}`;

  return (
    <section
      id="vendor-inline-expense"
      className={outerClass}
      aria-labelledby={embedded ? undefined : "wholesaler-expense-heading"}
      aria-label={embedded ? "Expense" : undefined}
    >
      {headerBlock}

      <form onSubmit={handleSubmit} className={`${formStack} ${formPadding}`}>
        {submitError ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <p className="font-medium">Could not save expense.</p>
            <p className="mt-1">{submitError}</p>
          </div>
        ) : null}

        <div className={primaryRowGrid}>
          <div className={primaryFieldShell}>
            <label
              htmlFor="wholesaler-expense-amount"
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
                  id="wholesaler-expense-amount"
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
                  className={`${textField} w-full ${isCompact ? "pl-6" : "pl-7"} tabular-nums`}
                  placeholder="0.00"
                  aria-label="Expense amount in dollars"
                />
              </div>
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
                    After this expense:{" "}
                    <span className="font-medium text-stone-900">
                      {formatCurrency(projected)}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={primaryFieldShell}>
            <label
              htmlFor="wholesaler-expense-desc"
              className={`${workspaceFormLabel} block`}
            >
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="wholesaler-expense-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${textField} ${isCompact ? "mt-1.5" : "mt-2"}`}
              placeholder="e.g. Shipping, supplies"
              autoComplete="off"
            />
            {fieldErrors.description ? (
              <p className="mt-2 text-xs text-red-600">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className={secondaryRowGrid}>
          <div className="min-w-0">
            <p
              className={`${workspaceFormLabelSecondary} text-sm leading-snug text-gray-700`}
            >
              Scope: Vendor only
            </p>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="wholesaler-expense-date"
              className={`${workspaceFormLabelSecondary} block`}
            >
              Expense date
            </label>
            <input
              id="wholesaler-expense-date"
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
            tone={embedded ? "flush" : "default"}
            id="wholesaler-inline-expense-receipt"
            label={
              <>
                Receipt{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </>
            }
            helperText={`PDF or image (PNG/JPEG), max ${MAX_MB} MB.${
              isEdit && existingReceipts.length > 0
                ? ` Linked: ${existingReceipts.map((r) => r.filename).join(", ")}.`
                : ""
            }`}
            accept={ACCEPT_RECEIPT}
            onChange={handleReceiptChange}
            error={receiptError}
            fileName={
              receiptFile && !receiptError?.startsWith("Expense saved")
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
                Delete expense
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
                icon={<DocumentTextIcon className={workspaceActionIconMd} />}
              >
                {submitting ? "Saving…" : "Record expense"}
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
        title="Delete this expense?"
        description="This removes the expense from the ledger. You can add a new expense later if needed."
        confirmLabel={deleting ? "Deleting…" : "Delete expense"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
