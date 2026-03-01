import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { readLedgerEntries } from '../read-models/ledger-entries';
import {
  BALANCES_SORT_DIRS,
  BALANCES_SORT_KEYS,
  getWholesalerBalancesView,
} from '../services/balancesView';
import { ValidationError } from '../utils/errors';

const yyyyMmDdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatCurrency2dp(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function normalizeDateYyyyMmDd(value?: string | null): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function parseSortKey(raw?: string): (typeof BALANCES_SORT_KEYS)[number] {
  return BALANCES_SORT_KEYS.includes(raw as (typeof BALANCES_SORT_KEYS)[number])
    ? (raw as (typeof BALANCES_SORT_KEYS)[number])
    : 'balance_owed';
}

function parseSortDir(raw?: string): (typeof BALANCES_SORT_DIRS)[number] {
  return BALANCES_SORT_DIRS.includes(raw as (typeof BALANCES_SORT_DIRS)[number])
    ? (raw as (typeof BALANCES_SORT_DIRS)[number])
    : 'desc';
}

function toCsvText(header: string[], rows: Array<Array<string | number>>): string {
  const csvLines: string[] = [header.map(escapeCsv).join(',')];
  for (const row of rows) {
    csvLines.push(row.map(escapeCsv).join(','));
  }
  return csvLines.join('\n');
}

function todayFileDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function exportRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get<{
    Querystring: {
      search?: string;
      owingOnly?: string;
      sortKey?: string;
      sortDir?: string;
    };
  }>(
    '/exports/balances.csv',
    {
      preHandler: adminPre,
      schema: {
        description: 'Export balances as CSV (filtered/sorted by query params)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            owingOnly: { type: 'string', enum: ['true', 'false'] },
            sortKey: { type: 'string', enum: [...BALANCES_SORT_KEYS] },
            sortDir: { type: 'string', enum: [...BALANCES_SORT_DIRS] },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query;
      const search = typeof query.search === 'string' ? query.search.trim() : '';
      const owingOnly = query.owingOnly === 'true';
      const sortKey = parseSortKey(query.sortKey);
      const sortDir = parseSortDir(query.sortDir);

      const pool = getPool();
      const rows = await getWholesalerBalancesView(pool, {
        search,
        owingOnly,
        sortKey,
        sortDir,
      });

      const header = [
        'Wholesaler',
        'Owed Total',
        'Paid Total',
        'Balance Owed',
        'Last Payment Date',
      ];
      const csvRows = rows.map((r) => [
        r.wholesaler_name,
        formatCurrency2dp(r.owed_total),
        formatCurrency2dp(r.paid_total),
        formatCurrency2dp(r.balance_owed),
        normalizeDateYyyyMmDd(r.last_payment_date),
      ]);
      const csvText = toCsvText(header, csvRows);
      const bom = '\uFEFF';
      const body = bom + csvText;
      const filename = `balances-${todayFileDate()}.csv`;

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(body);
    }
  );

  fastify.get<{
    Querystring: {
      wholesalerId?: string;
      start?: string;
      end?: string;
    };
  }>(
    '/exports/ledger.csv',
    {
      preHandler: adminPre,
      schema: {
        description: 'Export transaction-level ledger entries as CSV',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            wholesalerId: { type: 'string', format: 'uuid' },
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' },
          },
        },
      },
    },
    async (request, reply) => {
      const wholesalerIdRaw = request.query.wholesalerId;
      const startRaw = request.query.start;
      const endRaw = request.query.end;

      const wholesalerIdParsed = wholesalerIdRaw
        ? z.string().uuid().safeParse(wholesalerIdRaw)
        : null;
      if (wholesalerIdParsed && !wholesalerIdParsed.success) {
        throw new ValidationError('Invalid wholesalerId', wholesalerIdParsed.error.errors);
      }
      const startParsed = startRaw ? yyyyMmDdSchema.safeParse(startRaw) : null;
      if (startParsed && !startParsed.success) {
        throw new ValidationError(
          'Invalid start date (must be YYYY-MM-DD)',
          startParsed.error.errors
        );
      }
      const endParsed = endRaw ? yyyyMmDdSchema.safeParse(endRaw) : null;
      if (endParsed && !endParsed.success) {
        throw new ValidationError('Invalid end date (must be YYYY-MM-DD)', endParsed.error.errors);
      }

      const wholesalerId = wholesalerIdParsed?.success ? wholesalerIdParsed.data : undefined;
      const start = startParsed?.success ? startParsed.data : undefined;
      const end = endParsed?.success ? endParsed.data : undefined;
      if (start && end && start > end) {
        throw new ValidationError('Invalid date range: start must be <= end');
      }

      const pool = getPool();
      const rows = await readLedgerEntries(pool, {
        wholesalerId,
        startDate: start,
        endDate: end,
      });

      const header = [
        'Date',
        'Wholesaler',
        'Type',
        'Show',
        'Reference ID',
        'Description',
        'Amount',
      ];
      const csvRows = rows.map((r) => [
        normalizeDateYyyyMmDd(r.date),
        r.wholesaler,
        r.type,
        r.show ?? '',
        r.reference_id,
        r.description,
        formatCurrency2dp(r.amount),
      ]);
      const csvText = toCsvText(header, csvRows);
      const body = '\uFEFF' + csvText;
      const filename = `ledger-${todayFileDate()}.csv`;

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(body);
    }
  );
}
