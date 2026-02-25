import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';

const SORT_KEYS = [
  'name',
  'owed_total',
  'paid_total',
  'balance_owed',
  'last_payment_date',
] as const;
const SORT_DIRS = ['asc', 'desc'] as const;

/** Whitelist: sortKey -> SQL expression for ORDER BY (safe, no user input). */
const ORDER_BY_EXPR: Record<(typeof SORT_KEYS)[number], string> = {
  name: 'name',
  owed_total: 'owed_total',
  paid_total: 'paid_total',
  balance_owed: '(owed_total - paid_total)',
  last_payment_date: 'last_payment_date',
};

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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
            sortKey: { type: 'string', enum: [...SORT_KEYS] },
            sortDir: { type: 'string', enum: [...SORT_DIRS] },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query;
      const search = typeof query.search === 'string' ? query.search.trim() : '';
      const owingOnly = query.owingOnly === 'true';
      const sortKey = SORT_KEYS.includes(query.sortKey as (typeof SORT_KEYS)[number])
        ? (query.sortKey as (typeof SORT_KEYS)[number])
        : 'balance_owed';
      const sortDir = SORT_DIRS.includes(query.sortDir as (typeof SORT_DIRS)[number])
        ? (query.sortDir as (typeof SORT_DIRS)[number])
        : 'desc';

      const pool = getPool();
      const orderByExpr = ORDER_BY_EXPR[sortKey];
      const dir = sortDir.toUpperCase();

      const result = await pool.query(
        `SELECT * FROM (
          SELECT w.id AS wholesaler_id, w.name,
            (SELECT COALESCE(SUM(amount), 0)::numeric FROM owed_line_items WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS owed_total,
            (SELECT COALESCE(SUM(amount), 0)::numeric FROM payments WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS paid_total,
            (SELECT MAX(payment_date)::date FROM payments WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS last_payment_date
          FROM wholesalers w
          WHERE w.deleted_at IS NULL
        ) sub
        WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')
        AND (NOT $2 OR (owed_total - paid_total) > 0)
        ORDER BY ${orderByExpr} ${dir}`,
        [search, owingOnly]
      );

      const rows = result.rows as Array<{
        name: string;
        owed_total: string;
        paid_total: string;
        last_payment_date: string | null;
      }>;

      const header = [
        'Wholesaler',
        'Owed Total',
        'Paid Total',
        'Balance Owed',
        'Last Payment Date',
      ];
      const csvLines: string[] = [
        header.map(escapeCsv).join(','),
        ...rows.map((r) => {
          const owed = parseFloat(r.owed_total);
          const paid = parseFloat(r.paid_total);
          const balance = owed - paid;
          const dateCell = r.last_payment_date ? String(r.last_payment_date).slice(0, 10) : '';
          return [r.name, owed, paid, balance, dateCell].map(escapeCsv).join(',');
        }),
      ];
      const csvText = csvLines.join('\n');
      const bom = '\uFEFF';
      const body = bom + csvText;

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const filename = `balances-${yyyy}-${mm}-${dd}.csv`;

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(body);
    }
  );
}
