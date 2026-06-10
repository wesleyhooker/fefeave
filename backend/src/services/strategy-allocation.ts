import type { Pool, PoolClient } from 'pg';
import type { StrategyAllocationType } from '../constants/strategy-allocation';
import { roundMoney } from './event-adjusted-cash';

export type StrategyAllocationRow = {
  id: string;
  period_week_start: string;
  period_week_end: string;
  allocation_type: StrategyAllocationType;
  amount: string;
  note: string | null;
  recorded_at: Date;
  voided_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
};

export type StrategyAllocationEntryDto = {
  id: string;
  periodWeekStart: string;
  periodWeekEnd: string;
  allocationType: StrategyAllocationType;
  amount: string;
  note?: string;
  recordedAt: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PeriodAllocationLineDto = {
  target: string | null;
  recorded: string;
};

export type PeriodAllocationsDto = {
  weekStartDate: string;
  weekEndDate: string;
  taxSetAside: PeriodAllocationLineDto;
  reinvestmentSetAside: PeriodAllocationLineDto;
  entries: StrategyAllocationEntryDto[];
};

type Db = Pick<Pool | PoolClient, 'query'>;

export function formatAllocationMoney(value: number): string {
  return roundMoney(value).toFixed(2);
}

export function addDaysYmd(yyyyMmDd: string, days: number): string {
  const year = Number(yyyyMmDd.slice(0, 4));
  const month = Number(yyyyMmDd.slice(5, 7));
  const day = Number(yyyyMmDd.slice(8, 10));
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function toYyyyMmDd(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function toStrategyAllocationEntryDto(
  row: StrategyAllocationRow
): StrategyAllocationEntryDto {
  return {
    id: row.id,
    periodWeekStart: toYyyyMmDd(row.period_week_start),
    periodWeekEnd: toYyyyMmDd(row.period_week_end),
    allocationType: row.allocation_type,
    amount: formatAllocationMoney(Number(row.amount)),
    note: row.note ?? undefined,
    recordedAt: row.recorded_at.toISOString(),
    voidedAt: row.voided_at ? row.voided_at.toISOString() : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function sumRecordedAllocationsByWeek(
  db: Db,
  periodWeekStart: string,
  allocationType?: StrategyAllocationType
): Promise<Record<StrategyAllocationType, number>> {
  const params: unknown[] = [periodWeekStart];
  let typeFilter = '';
  if (allocationType) {
    params.push(allocationType);
    typeFilter = ' AND allocation_type = $2';
  }

  const result = await db.query(
    `SELECT allocation_type::text AS allocation_type, COALESCE(SUM(amount), 0)::numeric AS total
     FROM strategy_allocation_entries
     WHERE period_week_start = $1
       AND deleted_at IS NULL
       AND voided_at IS NULL
       ${typeFilter}
     GROUP BY allocation_type`,
    params
  );

  const totals: Record<StrategyAllocationType, number> = {
    TAX_SET_ASIDE: 0,
    REINVESTMENT_SET_ASIDE: 0,
  };

  for (const row of result.rows as Array<{
    allocation_type: StrategyAllocationType;
    total: string;
  }>) {
    totals[row.allocation_type] = roundMoney(Number(row.total));
  }

  return totals;
}

export async function listStrategyAllocationsByWeek(
  db: Db,
  periodWeekStart: string,
  options?: { includeVoided?: boolean }
): Promise<StrategyAllocationRow[]> {
  const includeVoided = options?.includeVoided === true;
  const voidFilter = includeVoided ? '' : ' AND voided_at IS NULL';

  const result = await db.query(
    `SELECT id, period_week_start, period_week_end, allocation_type::text AS allocation_type,
            amount, note, recorded_at, voided_at, created_by, created_at, updated_at
     FROM strategy_allocation_entries
     WHERE period_week_start = $1
       AND deleted_at IS NULL
       ${voidFilter}
     ORDER BY recorded_at ASC, created_at ASC`,
    [periodWeekStart]
  );

  return result.rows as StrategyAllocationRow[];
}

export async function getStrategyAllocationEntryById(
  db: Db,
  entryId: string
): Promise<StrategyAllocationRow | null> {
  const result = await db.query(
    `SELECT id, period_week_start, period_week_end, allocation_type::text AS allocation_type,
            amount, note, recorded_at, voided_at, created_by, created_at, updated_at
     FROM strategy_allocation_entries
     WHERE id = $1 AND deleted_at IS NULL`,
    [entryId]
  );
  return (result.rows[0] as StrategyAllocationRow | undefined) ?? null;
}

export async function buildPeriodAllocationsDto(
  db: Db,
  periodWeekStart: string
): Promise<PeriodAllocationsDto> {
  const periodWeekEnd = addDaysYmd(periodWeekStart, 6);
  const totals = await sumRecordedAllocationsByWeek(db, periodWeekStart);
  const rows = await listStrategyAllocationsByWeek(db, periodWeekStart);

  return {
    weekStartDate: periodWeekStart,
    weekEndDate: periodWeekEnd,
    taxSetAside: {
      target: null,
      recorded: formatAllocationMoney(totals.TAX_SET_ASIDE),
    },
    reinvestmentSetAside: {
      target: null,
      recorded: formatAllocationMoney(totals.REINVESTMENT_SET_ASIDE),
    },
    entries: rows.map(toStrategyAllocationEntryDto),
  };
}

export async function insertStrategyAllocationEntry(
  db: Db,
  args: {
    periodWeekStart: string;
    periodWeekEnd: string;
    allocationType: StrategyAllocationType;
    amount: number;
    note: string | null;
    recordedAt?: Date;
    createdBy: string | null;
  }
): Promise<StrategyAllocationRow> {
  const amount = roundMoney(Math.max(0, args.amount));
  const result = await db.query(
    `INSERT INTO strategy_allocation_entries (
       period_week_start, period_week_end, allocation_type, amount, note, recorded_at, created_by
     )
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), $7)
     RETURNING id, period_week_start, period_week_end, allocation_type::text AS allocation_type,
               amount, note, recorded_at, voided_at, created_by, created_at, updated_at`,
    [
      args.periodWeekStart,
      args.periodWeekEnd,
      args.allocationType,
      amount,
      args.note,
      args.recordedAt ?? null,
      args.createdBy,
    ]
  );
  return result.rows[0] as StrategyAllocationRow;
}

export async function voidStrategyAllocationEntry(
  db: Db,
  entryId: string,
  voidedAt: Date
): Promise<StrategyAllocationRow | null> {
  const result = await db.query(
    `UPDATE strategy_allocation_entries
     SET voided_at = $2, updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
       AND voided_at IS NULL
     RETURNING id, period_week_start, period_week_end, allocation_type::text AS allocation_type,
               amount, note, recorded_at, voided_at, created_by, created_at, updated_at`,
    [entryId, voidedAt]
  );
  return (result.rows[0] as StrategyAllocationRow | undefined) ?? null;
}
