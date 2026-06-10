import {
  WORKFLOW_OWNER_DRAW_STATUS_PAID,
  WORKFLOW_OWNER_DRAW_STATUS_PARTIALLY_PAID,
  WORKFLOW_OWNER_DRAW_STATUS_UNAVAILABLE,
  WORKFLOW_OWNER_DRAW_STATUS_UNPAID,
  WORKFLOW_OWNER_DRAW_STATUS_VOIDED,
} from '@/app/(admin)/admin/_lib/adminWorkflowCopy';

export type OwnerDrawWeekStatus =
  | 'unavailable'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'voided';

export function deriveOwnerDrawWeekStatus(args: {
  remainingAmount: number;
  ownerPaidThisPeriod: number;
  allowedPayoutForPeriod: number;
  hasActivePayout: boolean;
  hasVoidedThisWeek: boolean;
}): OwnerDrawWeekStatus {
  const remaining = roundMoney(args.remainingAmount);
  const paid = roundMoney(args.ownerPaidThisPeriod);
  const allowed = roundMoney(args.allowedPayoutForPeriod);

  if (args.hasActivePayout && remaining <= 0 && allowed > 0) {
    return 'paid';
  }
  if (args.hasVoidedThisWeek && !args.hasActivePayout) {
    return 'voided';
  }
  if (remaining <= 0 && !args.hasActivePayout) {
    return 'unavailable';
  }
  if (paid > 0 && remaining > 0) {
    return 'partially_paid';
  }
  if (remaining > 0 && paid <= 0) {
    return 'unpaid';
  }
  return 'unavailable';
}

export function ownerDrawWeekStatusLabel(status: OwnerDrawWeekStatus): string {
  switch (status) {
    case 'paid':
      return WORKFLOW_OWNER_DRAW_STATUS_PAID;
    case 'partially_paid':
      return WORKFLOW_OWNER_DRAW_STATUS_PARTIALLY_PAID;
    case 'unpaid':
      return WORKFLOW_OWNER_DRAW_STATUS_UNPAID;
    case 'voided':
      return WORKFLOW_OWNER_DRAW_STATUS_VOIDED;
    default:
      return WORKFLOW_OWNER_DRAW_STATUS_UNAVAILABLE;
  }
}

export function ownerDrawStatusBadgeTone(
  status: OwnerDrawWeekStatus,
): 'Paid' | 'Voided' | 'Unpaid' | 'Open' {
  if (status === 'paid') return 'Paid';
  if (status === 'voided') return 'Voided';
  if (status === 'partially_paid') return 'Open';
  if (status === 'unpaid') return 'Unpaid';
  return 'Open';
}

export function formatOwnerDrawDashboardTeaser(args: {
  status: OwnerDrawWeekStatus;
  remainingAmount: number;
  ownerPaidThisPeriod: number;
  paidAtLabel: string | null;
  formatCurrency: (n: number) => string;
}): string {
  const remaining = args.formatCurrency(args.remainingAmount);
  if (args.status === 'paid' && args.paidAtLabel) {
    const paidTotal = args.formatCurrency(args.ownerPaidThisPeriod);
    return `Paid to owner · ${paidTotal} · ${args.paidAtLabel}`;
  }
  if (args.status === 'partially_paid') {
    const paid = args.formatCurrency(args.ownerPaidThisPeriod);
    return `Partially paid · ${paid} paid to owner · ${remaining} remaining`;
  }
  if (args.status === 'voided') {
    return args.remainingAmount > 0
      ? `Voided · ${remaining} available`
      : 'Voided · no amount available';
  }
  if (args.remainingAmount > 0) {
    return `Unpaid · ${remaining}`;
  }
  return 'No owner payout available yet';
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
