import {
  vendorDetailLedgerExpenseHref,
  vendorDetailLedgerPaymentHref,
} from '@/app/(admin)/admin/_lib/vendorRoutes';
import {
  fetchOwedLineItemAttachments,
  fetchPaymentAttachments,
  type ShowAttachmentItem,
} from '@/src/lib/api/attachments';
import type { PaymentDTO } from '@/src/lib/api/payments';
import type { WholesalerStatementRowView } from '@/src/lib/api/wholesalers';

import {
  WORKFLOW_VENDOR_ATTACHMENT_SOURCE_CHARGE,
  WORKFLOW_VENDOR_ATTACHMENT_SOURCE_PAYMENT,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';

export type VendorDetailAttachmentSourceType = 'payment' | 'vendor_charge';

export type VendorDetailAttachmentRow = {
  id: string;
  filename: string;
  contentType: string;
  createdAt: string;
  sourceType: VendorDetailAttachmentSourceType;
  sourceLabel: string;
  sourceDate: string;
  sourceHref: string;
};

const VENDOR_DETAIL_ATTACHMENTS_LIMIT = 8;

function mapAttachment(
  att: ShowAttachmentItem,
  meta: Omit<
    VendorDetailAttachmentRow,
    'id' | 'filename' | 'contentType' | 'createdAt'
  >,
): VendorDetailAttachmentRow {
  return {
    id: att.id,
    filename: att.filename,
    contentType: att.contentType,
    createdAt: att.createdAt,
    ...meta,
  };
}

/** Client-side rollup from payment and vendor-charge entities already on the page. */
export async function fetchVendorDetailAttachments(args: {
  vendorId: string;
  payments: PaymentDTO[];
  statement: WholesalerStatementRowView[];
}): Promise<VendorDetailAttachmentRow[]> {
  const { vendorId, payments, statement } = args;

  const paymentFetches = payments.map(async (payment) => {
    const list = await fetchPaymentAttachments(payment.id);
    const label = payment.reference?.trim() || 'Vendor payment';
    return list.map((att) =>
      mapAttachment(att, {
        sourceType: 'payment',
        sourceLabel: label,
        sourceDate: payment.payment_date,
        sourceHref: vendorDetailLedgerPaymentHref(vendorId, payment.id),
      }),
    );
  });

  const chargeRows = statement.filter(
    (row) => row.ledgerEntryKind === 'VENDOR_EXPENSE',
  );
  const chargeFetches = chargeRows.map(async (row) => {
    const list = await fetchOwedLineItemAttachments(row.entryId);
    const label =
      row.description?.trim() || row.showName?.trim() || 'Vendor charge';
    return list.map((att) =>
      mapAttachment(att, {
        sourceType: 'vendor_charge',
        sourceLabel: label,
        sourceDate: row.date,
        sourceHref: vendorDetailLedgerExpenseHref(vendorId, row.entryId),
      }),
    );
  });

  const batches = await Promise.all([...paymentFetches, ...chargeFetches]);
  const merged = batches.flat();

  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const seen = new Set<string>();
  const deduped: VendorDetailAttachmentRow[] = [];
  for (const row of merged) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    deduped.push(row);
    if (deduped.length >= VENDOR_DETAIL_ATTACHMENTS_LIMIT) break;
  }

  return deduped;
}

export function vendorAttachmentSourceLabel(
  sourceType: VendorDetailAttachmentSourceType,
): string {
  return sourceType === 'payment'
    ? WORKFLOW_VENDOR_ATTACHMENT_SOURCE_PAYMENT
    : WORKFLOW_VENDOR_ATTACHMENT_SOURCE_CHARGE;
}
