/**
 * Client-only persistence for weekly self-pay completion (until a server model exists).
 * Keyed by Monday YYYY-MM-DD of the week.
 */

export type SelfPayStored = {
  paid: boolean;
  /** ISO timestamp when marked paid */
  paidAt?: string;
  /** Estimated week profit at time of marking (reference only) */
  profitSnapshot?: number;
};

const prefix = 'fefeave.dashboard.selfPay.v1:';

export function loadSelfPay(weekStartYmd: string): SelfPayStored | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(prefix + weekStartYmd);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelfPayStored;
    if (typeof parsed.paid !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSelfPay(weekStartYmd: string, data: SelfPayStored): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(prefix + weekStartYmd, JSON.stringify(data));
}

export function clearSelfPay(weekStartYmd: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(prefix + weekStartYmd);
}
