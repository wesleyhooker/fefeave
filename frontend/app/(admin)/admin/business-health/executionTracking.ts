export function toMoneyNum(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Remaining = max(0, target − recorded) for display consistency. */
export function computeExecutionRemaining(
  target: number,
  recorded: number,
): number {
  return Math.max(0, Number((target - recorded).toFixed(2)));
}

export type ExecutionRowStatus =
  | 'not_started'
  | 'partial'
  | 'complete'
  | 'no_target';

export function deriveExecutionRowStatus(
  target: number,
  recorded: number,
  remaining: number,
): ExecutionRowStatus {
  if (target <= 0) return 'no_target';
  if (remaining <= 0 && target > 0) return 'complete';
  if (recorded > 0 && remaining > 0) return 'partial';
  if (recorded === 0 && remaining > 0) return 'not_started';
  return 'complete';
}

export type ExecutionRowKind = 'set_aside' | 'owner_payout';

export function executionRowStatusLabel(
  status: ExecutionRowStatus,
  kind: ExecutionRowKind,
): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'partial':
      return kind === 'owner_payout' ? 'Partially paid' : 'Partially set aside';
    case 'complete':
      return 'Complete';
    case 'no_target':
      return 'No target';
    default:
      return '—';
  }
}
