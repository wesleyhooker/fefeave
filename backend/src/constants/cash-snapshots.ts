/** V1 cash snapshot sources — bank feeds will extend this later. */
export const CASH_SNAPSHOT_SOURCES = ['MANUAL'] as const;

export type CashSnapshotSource = (typeof CASH_SNAPSHOT_SOURCES)[number];

export const DEFAULT_CASH_SNAPSHOT_SOURCE: CashSnapshotSource = 'MANUAL';
