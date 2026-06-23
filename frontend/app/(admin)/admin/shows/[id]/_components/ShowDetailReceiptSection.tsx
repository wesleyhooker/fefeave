"use client";

import type { ChangeEvent, RefObject } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import {
  WORKFLOW_SHOW_RECEIPT_ATTACH_LABEL,
  WORKFLOW_SHOW_RECEIPT_HINT,
  WORKFLOW_SHOW_RECEIPT_HEADING,
  WORKFLOW_SHOW_RECEIPT_OPTIONAL,
  WORKFLOW_SHOW_RECEIPT_REPLACE_LABEL,
  WORKFLOW_SHOW_RECEIPT_UPLOADING,
  WORKFLOW_SHOW_RECEIPT_UPLOAD_LABEL,
  WORKFLOW_SHOW_RECEIPT_VIEW_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceSectionCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceSectionCard";
import {
  workspaceActionIconMd,
  workspaceActionIconSm,
  workspaceActionSecondaryMd,
  workspaceActionUtilitySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowAttachmentItem } from "@/src/lib/api/attachments";
import {
  SHOW_DETAIL_RECEIPT_CONTENT,
  SHOW_DETAIL_RECEIPT_SECTION_BODY,
  SHOW_DETAIL_RECEIPT_UPLOAD_ZONE,
} from "../_lib/showDetailLayout";

type ShowDetailReceiptSectionProps = {
  isClosed: boolean;
  uploadingReceipt: boolean;
  receiptFile: File | null;
  receiptError: string | null;
  showAttachments: ShowAttachmentItem[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAttach: () => void;
  onChooseFile: () => void;
  onClearPendingFile: () => void;
  onViewAttachment: (att: ShowAttachmentItem) => void;
};

/**
 * Show detail receipt — state-driven workflow.
 * Receipt is optional evidence; upload allowed after close when none attached.
 */
export function ShowDetailReceiptSection({
  isClosed,
  uploadingReceipt,
  receiptFile,
  receiptError,
  showAttachments,
  fileInputRef,
  onFileChange,
  onAttach,
  onChooseFile,
  onClearPendingFile,
  onViewAttachment,
}: ShowDetailReceiptSectionProps) {
  const attachedReceipt = showAttachments[0] ?? null;
  const hasAttachedReceipt = attachedReceipt != null;

  return (
    <WorkspaceSectionCard
      titleId="payout-receipt-heading"
      bodyClassName={SHOW_DETAIL_RECEIPT_SECTION_BODY}
      contentClassName={SHOW_DETAIL_RECEIPT_CONTENT}
      title={
        <>
          {WORKFLOW_SHOW_RECEIPT_HEADING}{" "}
          <span className="text-sm font-normal text-admin-inkMuted sm:text-base">
            {WORKFLOW_SHOW_RECEIPT_OPTIONAL}
          </span>
        </>
      }
    >
      <input
        ref={fileInputRef}
        id="show-receipt-file"
        type="file"
        className="sr-only"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        onChange={onFileChange}
      />

      {uploadingReceipt ? (
        <p className="text-sm text-admin-inkMuted">
          {WORKFLOW_SHOW_RECEIPT_UPLOADING}
        </p>
      ) : receiptFile ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <p className="min-w-0 max-w-full truncate text-sm text-admin-ink">
            {receiptFile.name}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAttach}
              disabled={uploadingReceipt}
              className={`${workspaceActionSecondaryMd} shadow-none`}
            >
              {WORKFLOW_SHOW_RECEIPT_ATTACH_LABEL}
            </button>
            <button
              type="button"
              onClick={onClearPendingFile}
              disabled={uploadingReceipt}
              className={workspaceActionUtilitySm}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : hasAttachedReceipt ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="min-w-0 max-w-full truncate text-sm text-admin-ink">
            {attachedReceipt.filename}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onViewAttachment(attachedReceipt)}
              className={`${workspaceActionSecondaryMd} shadow-none`}
            >
              {WORKFLOW_SHOW_RECEIPT_VIEW_LABEL}
            </button>
            {!isClosed ? (
              <button
                type="button"
                onClick={onChooseFile}
                className={workspaceActionUtilitySm}
              >
                <ArrowUpTrayIcon
                  className={`${workspaceActionIconSm} mr-1.5`}
                  aria-hidden
                />
                {WORKFLOW_SHOW_RECEIPT_REPLACE_LABEL}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onChooseFile}
          className={SHOW_DETAIL_RECEIPT_UPLOAD_ZONE}
        >
          <ArrowUpTrayIcon
            className={`${workspaceActionIconMd} shrink-0 text-admin-inkMuted`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-admin-inkMuted">
              {WORKFLOW_SHOW_RECEIPT_UPLOAD_LABEL}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-admin-inkMuted/85">
              {WORKFLOW_SHOW_RECEIPT_HINT}
            </span>
          </span>
        </button>
      )}

      {receiptError ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {receiptError}
        </p>
      ) : null}
    </WorkspaceSectionCard>
  );
}
