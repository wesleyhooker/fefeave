"use client";

import Link from "next/link";
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/format";
import { WorkspaceSectionCard } from "@/app/(admin)/admin/_components/workspace/WorkspaceSectionCard";
import {
  WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_HEADING,
  WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconSm,
  workspaceActionUtilitySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { getAttachmentDownloadUrl } from "@/src/lib/api/attachments";
import {
  vendorAttachmentSourceLabel,
  type VendorDetailAttachmentRow,
} from "../_lib/vendorDetailAttachments";
import {
  VENDOR_DETAIL_RAIL_CARD_BODY,
  VENDOR_DETAIL_RAIL_CARD_SURFACE,
} from "../_lib/vendorDetailLayout";
import { VendorDetailAttachmentsEmptyState } from "./VendorDetailAttachmentsEmptyState";

function AttachmentFileIcon({ contentType }: { contentType: string }) {
  const isImage = contentType.startsWith("image/");
  const Icon = isImage ? PhotoIcon : DocumentIcon;
  return <Icon className={`${workspaceActionIconSm} text-admin-inkMuted`} />;
}

function AttachmentRow({
  row,
  onDownload,
}: {
  row: VendorDetailAttachmentRow;
  onDownload: (id: string) => void;
}) {
  const sourceTypeLabel = vendorAttachmentSourceLabel(row.sourceType);

  return (
    <li className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-mutedStrip/40"
        aria-hidden
      >
        <AttachmentFileIcon contentType={row.contentType} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-admin-ink">
          {row.filename}
        </p>
        <p className="mt-0.5 text-xs text-admin-inkMuted">
          {sourceTypeLabel}
          <span className="text-admin-border"> · </span>
          <Link
            href={row.sourceHref}
            className="text-admin-actionPrimary hover:text-admin-actionPrimary/85"
          >
            {row.sourceLabel}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-admin-inkMuted">
          {formatDate(row.sourceDate)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDownload(row.id)}
        className={`${workspaceActionUtilitySm} shrink-0 self-center`}
        aria-label={`Download ${row.filename}`}
      >
        <ArrowDownTrayIcon className={workspaceActionIconSm} aria-hidden />
      </button>
    </li>
  );
}

export function VendorDetailAttachmentsCard({
  attachments,
  loading,
}: {
  attachments: VendorDetailAttachmentRow[];
  loading: boolean;
}) {
  async function handleDownload(attachmentId: string) {
    try {
      const { downloadUrl } = await getAttachmentDownloadUrl(attachmentId);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  }

  return (
    <WorkspaceSectionCard
      title={WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_HEADING}
      titleId="vendor-detail-attachments-heading"
      description={WORKFLOW_VENDOR_DETAIL_ATTACHMENTS_HINT}
      className={VENDOR_DETAIL_RAIL_CARD_SURFACE}
      bodyClassName={VENDOR_DETAIL_RAIL_CARD_BODY}
      contentClassName="mt-2"
    >
      {loading ? (
        <p className="text-sm text-admin-inkMuted">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <VendorDetailAttachmentsEmptyState />
      ) : (
        <ul className="divide-y divide-admin-border/40">
          {attachments.map((row) => (
            <AttachmentRow key={row.id} row={row} onDownload={handleDownload} />
          ))}
        </ul>
      )}
    </WorkspaceSectionCard>
  );
}
