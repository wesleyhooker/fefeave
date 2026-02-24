/**
 * Mock data and helpers for wholesalers, payments, and ledger (Epic 3.3).
 * Client-only; no API. Mutations for createPayment are in-memory for demo.
 */

export interface Wholesaler {
  id: string;
  name: string;
}

export type LedgerEntry =
  | {
      type: 'SETTLEMENT';
      date: string;
      showId: string;
      showName: string;
      amountOwed: number;
      note?: string;
    }
  | {
      type: 'PAYMENT';
      date: string;
      paymentId: string;
      amountPaid: number;
      method?: string;
      reference?: string;
    };

export interface Payment {
  id: string;
  date: string;
  wholesalerId: string;
  amount: number;
  method: string;
  reference: string;
  appliedTo?: Array<{ showId: string; amount: number }>;
}

/** Ledger row: belongs to a wholesaler. */
export type LedgerRow = { wholesalerId: string } & LedgerEntry;

// --- In-memory store (seeded; mutated by createPayment for demo) ---

const WHOLESALERS: Wholesaler[] = [
  { id: 'w1', name: 'Acme Wholesale' },
  { id: 'w2', name: 'Bulk Goods Co' },
  { id: 'w3', name: 'Local Vendor LLC' },
  { id: 'w4', name: 'Pop-Up Partners' },
  { id: 'w5', name: 'Summer Supplies' },
];

const LEDGER: LedgerRow[] = [
  {
    wholesalerId: 'w1',
    type: 'SETTLEMENT',
    date: '2025-03-10',
    showId: '1',
    showName: 'Spring Pop-Up 2025',
    amountOwed: 1700,
  },
  {
    wholesalerId: 'w1',
    type: 'PAYMENT',
    date: '2025-03-18',
    paymentId: 'p1',
    amountPaid: 1700,
    method: 'Zelle',
    reference: 'Ref 001',
  },
  {
    wholesalerId: 'w1',
    type: 'SETTLEMENT',
    date: '2025-11-25',
    showId: '2',
    showName: 'Holiday Market',
    amountOwed: 2380,
  },
  {
    wholesalerId: 'w2',
    type: 'SETTLEMENT',
    date: '2025-03-10',
    showId: '1',
    showName: 'Spring Pop-Up 2025',
    amountOwed: 500,
  },
  {
    wholesalerId: 'w2',
    type: 'PAYMENT',
    date: '2025-03-12',
    paymentId: 'p2',
    amountPaid: 500,
    method: 'Check',
    reference: 'Chk 101',
  },
  {
    wholesalerId: 'w2',
    type: 'SETTLEMENT',
    date: '2025-11-25',
    showId: '2',
    showName: 'Holiday Market',
    amountOwed: 800,
  },
  {
    wholesalerId: 'w3',
    type: 'SETTLEMENT',
    date: '2025-03-11',
    showId: '1',
    showName: 'Spring Pop-Up 2025',
    amountOwed: 1062.5,
  },
  {
    wholesalerId: 'w3',
    type: 'PAYMENT',
    date: '2025-03-20',
    paymentId: 'p3',
    amountPaid: 1062.5,
    method: 'Venmo',
    reference: '',
  },
  {
    wholesalerId: 'w4',
    type: 'SETTLEMENT',
    date: '2025-03-11',
    showId: '1',
    showName: 'Spring Pop-Up 2025',
    amountOwed: 850,
  },
  {
    wholesalerId: 'w4',
    type: 'PAYMENT',
    date: '2025-03-19',
    paymentId: 'p4',
    amountPaid: 850,
    method: 'Cash',
    reference: '',
  },
  {
    wholesalerId: 'w5',
    type: 'SETTLEMENT',
    date: '2025-07-18',
    showId: '3',
    showName: 'Summer Fair',
    amountOwed: 1550,
  },
  {
    wholesalerId: 'w5',
    type: 'PAYMENT',
    date: '2025-07-25',
    paymentId: 'p5',
    amountPaid: 1550,
    method: 'Zelle',
    reference: 'Summer Fair',
  },
];

let PAYMENTS: Payment[] = [
  {
    id: 'p1',
    date: '2025-03-18',
    wholesalerId: 'w1',
    amount: 1700,
    method: 'Zelle',
    reference: 'Ref 001',
  },
  {
    id: 'p2',
    date: '2025-03-12',
    wholesalerId: 'w2',
    amount: 500,
    method: 'Check',
    reference: 'Chk 101',
  },
  {
    id: 'p3',
    date: '2025-03-20',
    wholesalerId: 'w3',
    amount: 1062.5,
    method: 'Venmo',
    reference: '',
  },
  {
    id: 'p4',
    date: '2025-03-19',
    wholesalerId: 'w4',
    amount: 850,
    method: 'Cash',
    reference: '',
  },
  {
    id: 'p5',
    date: '2025-07-25',
    wholesalerId: 'w5',
    amount: 1550,
    method: 'Zelle',
    reference: 'Summer Fair',
  },
];

// --- Helpers ---

export function getWholesalers(): Wholesaler[] {
  return [...WHOLESALERS];
}

export function getWholesalerById(id: string): Wholesaler | null {
  return WHOLESALERS.find((w) => w.id === id) ?? null;
}

export function getWholesalerBalance(id: string): number {
  const rows = LEDGER.filter((r) => r.wholesalerId === id);
  let owed = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.type === 'SETTLEMENT') owed += r.amountOwed;
    else paid += r.amountPaid;
  }
  return owed - paid;
}

/** Ledger entries for a wholesaler, sorted by date desc. */
export function getWholesalerStatement(id: string): LedgerRow[] {
  return LEDGER.filter((r) => r.wholesalerId === id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPayments(): Payment[] {
  return [...PAYMENTS];
}

/** For static params: all wholesaler IDs. */
export function getWholesalerIds(): string[] {
  return WHOLESALERS.map((w) => w.id);
}

/** Create payment (demo: mutates in-memory LEDGER + PAYMENTS). Returns the new payment. */
export function createPayment(payload: {
  date: string;
  wholesalerId: string;
  amount: number;
  method: string;
  reference: string;
  appliedTo?: Array<{ showId: string; amount: number }>;
}): Payment {
  const id = `p${Date.now()}`;
  const payment: Payment = {
    id,
    date: payload.date,
    wholesalerId: payload.wholesalerId,
    amount: payload.amount,
    method: payload.method,
    reference: payload.reference,
    appliedTo: payload.appliedTo,
  };
  PAYMENTS.push(payment);
  LEDGER.push({
    wholesalerId: payload.wholesalerId,
    type: 'PAYMENT',
    date: payload.date,
    paymentId: id,
    amountPaid: payload.amount,
    method: payload.method,
    reference: payload.reference,
  });
  return payment;
}
