import { loadUnpaidClosedShowsFromEvents } from '../services/financial-statement-projections';
import { QueryableDb } from './db';

export interface UnpaidClosedShowRow {
  show_id: string;
  show_name: string;
  show_date: string;
  owed_total: string;
}

/**
 * Closed shows that contribute to current outstanding for a wholesaler.
 * Owed totals from `financial_events`; show metadata from operational `shows` table.
 */
export async function readUnpaidClosedShowsForWholesaler(
  db: QueryableDb,
  wholesalerId: string
): Promise<UnpaidClosedShowRow[]> {
  return loadUnpaidClosedShowsFromEvents(db, wholesalerId);
}
