import type { ShowFinancialSummary } from '@/app/(admin)/admin/_lib/showFinancialSummary';
import { WORKFLOW_SHOW_STATUS_COMPLETED_LABEL } from '@/app/(admin)/admin/_lib/adminWorkflowCopy';

export type ShowsIndexStatusTone =
  | 'closeOut'
  | 'open'
  | 'planned'
  | 'completed'
  | 'other';

export type ShowsIndexStatusPresentation = {
  label: string;
  tone: ShowsIndexStatusTone;
};

function activeNeedsCloseOut(
  summary: ShowFinancialSummary | undefined,
): boolean {
  if (summary == null) return false;
  return summary.settlementCount > 0 || summary.totalOwed > 0;
}

/** Table status column + show icon chip — shared semantics for the Shows index. */
export function getShowsIndexStatusPresentation(
  status: string,
  summary: ShowFinancialSummary | undefined,
): ShowsIndexStatusPresentation {
  const st = (status ?? '').trim().toUpperCase();
  if (st === 'COMPLETED') {
    return { label: 'Completed', tone: 'completed' };
  }
  if (st === 'PLANNED') {
    return { label: 'Planned', tone: 'planned' };
  }
  if (st === 'ACTIVE') {
    if (activeNeedsCloseOut(summary)) {
      return { label: 'Needs close-out', tone: 'closeOut' };
    }
    return { label: 'Open', tone: 'open' };
  }
  const raw = (status ?? '').trim();
  if (raw.length === 0) return { label: '—', tone: 'other' };
  return {
    label: raw.length <= 24 ? raw : `${raw.slice(0, 23)}…`,
    tone: 'other',
  };
}

/** CSV / screen-reader export label — includes locked wording for completed shows. */
export function getShowsIndexStatusExportLabel(
  status: string,
  summary: ShowFinancialSummary | undefined,
): string {
  const st = (status ?? '').trim().toUpperCase();
  if (st === 'COMPLETED') return WORKFLOW_SHOW_STATUS_COMPLETED_LABEL;
  return getShowsIndexStatusPresentation(status, summary).label;
}

export const SHOWS_INDEX_STATUS_CHIP_SHELL =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9';

export const SHOWS_INDEX_STATUS_CHIP_BY_TONE: Record<
  ShowsIndexStatusTone,
  string
> = {
  closeOut: 'bg-admin-semanticAmberSurface text-admin-semanticLiability',
  open: 'bg-admin-semanticBlueSurface text-admin-statusInfo',
  planned: 'bg-violet-50 text-violet-800',
  completed: 'bg-admin-semanticGreenSurface text-admin-statusSuccess',
  other: 'bg-admin-semanticClaySurface text-admin-inkMuted',
};

export const SHOWS_INDEX_STATUS_LABEL_BY_TONE: Record<
  ShowsIndexStatusTone,
  string
> = {
  closeOut: 'text-admin-semanticLiability',
  open: 'text-admin-statusInfo',
  planned: 'text-violet-800',
  completed: 'text-admin-statusSuccess',
  other: 'text-admin-inkMuted',
};
