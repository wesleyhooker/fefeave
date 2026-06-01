import { loadLedgerEntriesFromEvents } from '../services/financial-statement-projections';
import { QueryableDb } from './db';

export interface LedgerEntriesFilter {
  wholesalerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LedgerEntryReadRow {
  date: string;
  wholesaler: string;
  type: 'OWED' | 'PAYMENT';
  show: string | null;
  reference_id: string;
  description: string;
  amount: string;
}

/**
 * Event-derived transaction-level ledger read model.
 * Ordering is deterministic: date ASC, type (OWED then PAYMENT), reference_id ASC.
 */
export async function readLedgerEntries(
  db: QueryableDb,
  filters?: LedgerEntriesFilter
): Promise<LedgerEntryReadRow[]> {
  return loadLedgerEntriesFromEvents(db, {
    wholesalerId: filters?.wholesalerId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });
}
