import { formatCurrency, formatDate } from '@/lib/format';
import { downloadCsv, toCsv } from '@/lib/csv';
import {
  WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR,
  WORKFLOW_PURCHASES_PAYMENT_PAID_NOW,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';
import type { PurchaseActivityItem } from './purchaseActivityModel';

function purchasesExportFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `purchases-${yyyy}-${mm}-${dd}.csv`;
}

function paymentLabel(row: PurchaseActivityItem): string {
  if (row.kind !== 'inventory') return '';
  return row.paymentStatus === 'OWE_VENDOR'
    ? WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR
    : WORKFLOW_PURCHASES_PAYMENT_PAID_NOW;
}

export function exportPurchasesActivityCsv(rows: PurchaseActivityItem[]): void {
  const headers = [
    'Date',
    'Type',
    'Title',
    'Vendor',
    'Category',
    'Amount',
    'Payment',
  ];
  const data = rows.map((row) => [
    formatDate(row.date),
    row.typeLabel,
    row.title,
    row.vendorLabel ?? '',
    row.category ?? '',
    formatCurrency(row.amount),
    paymentLabel(row),
  ]);
  downloadCsv(purchasesExportFilename(), toCsv(headers, data), {
    includeBom: true,
  });
}
