// --- Types (aligned with backend concepts) ---

export type ShowStatus = 'Draft' | 'Settled' | 'Closed';

export interface SettlementRow {
  wholesaler: string;
  percentOrFixed: string;
  amountOwed: number;
  amountPaid: number;
}

export interface ShowSummary {
  id: string;
  name: string;
  date: string;
  payoutAfterFees: number;
  settlementCount: number;
  profitEstimate: number;
  status: ShowStatus;
}

export interface ShowDetail {
  id: string;
  name: string;
  date: string;
  payoutAfterFees: number;
  settlements: SettlementRow[];
  totalSettlementsOwed: number;
  remainingToAllocate: number;
  totalPaid: number;
  remainingToPay: number;
  estimatedProfit: number;
  status: ShowStatus;
  /** When set, status is Closed (for client-side status derivation). */
  closedAt?: string;
}

// --- Raw mock data (single source of truth) ---

interface RawShow {
  id: string;
  name: string;
  date: string;
  payoutAfterFees: number;
  settlements: SettlementRow[];
  closedAt?: string; // when set, status is Closed
}

const MOCK_RAW_SHOWS: RawShow[] = [
  {
    id: '1',
    name: 'Spring Pop-Up 2025',
    date: '2025-03-15',
    payoutAfterFees: 4250,
    closedAt: '2025-03-20',
    settlements: [
      {
        wholesaler: 'Acme Wholesale',
        percentOrFixed: '40%',
        amountOwed: 1700,
        amountPaid: 1700,
      },
      {
        wholesaler: 'Bulk Goods Co',
        percentOrFixed: '$500 fixed',
        amountOwed: 500,
        amountPaid: 500,
      },
      {
        wholesaler: 'Local Vendor LLC',
        percentOrFixed: '25%',
        amountOwed: 1062.5,
        amountPaid: 1062.5,
      },
      {
        wholesaler: 'Pop-Up Partners',
        percentOrFixed: '20%',
        amountOwed: 850,
        amountPaid: 850,
      },
    ],
  },
  {
    id: '2',
    name: 'Holiday Market',
    date: '2025-12-01',
    payoutAfterFees: 6800,
    settlements: [
      {
        wholesaler: 'Acme Wholesale',
        percentOrFixed: '35%',
        amountOwed: 2380,
        amountPaid: 0,
      },
      {
        wholesaler: 'Bulk Goods Co',
        percentOrFixed: '$800 fixed',
        amountOwed: 800,
        amountPaid: 0,
      },
    ],
  },
  {
    id: '3',
    name: 'Summer Fair',
    date: '2025-07-20',
    payoutAfterFees: 3100,
    closedAt: '2025-08-01',
    settlements: [
      {
        wholesaler: 'Summer Supplies',
        percentOrFixed: '50%',
        amountOwed: 1550,
        amountPaid: 1550,
      },
    ],
  },
];

// --- Helpers ---

function deriveStatus(show: RawShow): ShowStatus {
  const totalOwed = show.settlements.reduce((s, r) => s + r.amountOwed, 0);
  const totalPaid = show.settlements.reduce((s, r) => s + r.amountPaid, 0);
  const allPaid = totalOwed > 0 && totalPaid >= totalOwed;
  if (show.closedAt) return 'Closed';
  if (allPaid) return 'Settled';
  return 'Draft';
}

function rawToDetail(raw: RawShow): ShowDetail {
  const totalSettlementsOwed = raw.settlements.reduce(
    (s, r) => s + r.amountOwed,
    0,
  );
  const totalPaid = raw.settlements.reduce((s, r) => s + r.amountPaid, 0);
  const remainingToAllocate = raw.payoutAfterFees - totalSettlementsOwed;
  const remainingToPay = totalSettlementsOwed - totalPaid;
  const estimatedProfit = raw.payoutAfterFees - totalSettlementsOwed;

  return {
    id: raw.id,
    name: raw.name,
    date: raw.date,
    payoutAfterFees: raw.payoutAfterFees,
    settlements: raw.settlements,
    totalSettlementsOwed,
    remainingToAllocate,
    totalPaid,
    remainingToPay,
    estimatedProfit,
    status: deriveStatus(raw),
    closedAt: raw.closedAt,
  };
}

/** Derive status from settlements + closedAt (for client-side recompute). */
export function deriveStatusFromSettlements(
  settlements: SettlementRow[],
  closedAt?: string,
): ShowStatus {
  const totalOwed = settlements.reduce((s, r) => s + r.amountOwed, 0);
  const totalPaid = settlements.reduce((s, r) => s + r.amountPaid, 0);
  const remainingToPay = totalOwed - totalPaid;
  if (closedAt) return 'Closed';
  if (settlements.length >= 1 && remainingToPay === 0) return 'Settled';
  return 'Draft';
}

// --- Public API ---

export function getShowIds(): string[] {
  return MOCK_RAW_SHOWS.map((s) => s.id);
}

export function getShowSummaries(): ShowSummary[] {
  return MOCK_RAW_SHOWS.map((raw) => {
    const detail = rawToDetail(raw);
    return {
      id: raw.id,
      name: raw.name,
      date: raw.date,
      payoutAfterFees: raw.payoutAfterFees,
      settlementCount: raw.settlements.length,
      profitEstimate: detail.estimatedProfit,
      status: detail.status,
    };
  });
}

export function getShowDetail(id: string): ShowDetail | null {
  const raw = MOCK_RAW_SHOWS.find((s) => s.id === id) ?? null;
  return raw ? rawToDetail(raw) : null;
}
