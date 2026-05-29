import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { ValidationError } from '../utils/errors';
import { toYyyyMmDd } from '../utils/pg-date';
import { INVENTORY_CATEGORIES, INVENTORY_PURCHASE_TYPES } from '../constants/inventory';

/** Blank/whitespace-only string -> undefined; otherwise pass through for enum validation. */
const blankToUndefined = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/** Optional free text: trims, and treats blank as omitted (stored as NULL). */
const optionalTrimmedText = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().max(255).optional());

const postInventoryPurchaseSchema = z.object({
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'purchase_date must be YYYY-MM-DD'),
  amount: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n) || n <= 0) {
      throw new Error('amount must be greater than 0');
    }
    return n;
  }),
  notes: z.string().optional(),
  // Enrichment fields — all optional and backward compatible (old clients omit them).
  supplier: optionalTrimmedText,
  category: z.preprocess(blankToUndefined, z.enum(INVENTORY_CATEGORIES).optional()),
  purchase_type: z.preprocess(blankToUndefined, z.enum(INVENTORY_PURCHASE_TYPES).optional()),
});

interface InventoryPurchaseRow {
  id: string;
  purchase_date: string;
  amount: string;
  notes: string | null;
  supplier: string | null;
  category: string | null;
  purchase_type: string | null;
  created_at: Date;
}

function serializeInventoryPurchase(row: InventoryPurchaseRow) {
  return {
    id: row.id,
    purchase_date: toYyyyMmDd(row.purchase_date),
    amount: row.amount,
    notes: row.notes ?? undefined,
    supplier: row.supplier ?? undefined,
    category: row.category ?? undefined,
    purchase_type: row.purchase_type ?? undefined,
    created_at: row.created_at,
  };
}

function parseDaysQuery(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

export async function inventoryPurchaseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postInventoryPurchaseSchema> }>(
    '/inventory-purchases',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create an inventory purchase (cash-based, no SKU)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['purchase_date', 'amount'],
          properties: {
            purchase_date: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            notes: { type: 'string' },
            supplier: { type: 'string' },
            // Allowed values are enforced in the zod layer (-> 400 ValidationError).
            // Kept as plain strings here so invalid values are not rejected by
            // Fastify's native validation path (which would surface as 500).
            category: {
              type: 'string',
              description: `One of: ${INVENTORY_CATEGORIES.join(', ')}`,
            },
            purchase_type: {
              type: 'string',
              description: `One of: ${INVENTORY_PURCHASE_TYPES.join(', ')}`,
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              purchase_date: { type: 'string' },
              amount: { type: 'string' },
              notes: { type: 'string' },
              supplier: { type: 'string' },
              category: { type: 'string' },
              purchase_type: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postInventoryPurchaseSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { purchase_date, amount, notes, supplier, category, purchase_type } = parsed.data;
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO inventory_purchases (purchase_date, amount, notes, supplier, category, purchase_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, purchase_date, amount, notes, supplier, category, purchase_type, created_at`,
        [
          purchase_date,
          amount,
          notes ?? null,
          supplier ?? null,
          category ?? null,
          purchase_type ?? null,
        ]
      );
      const row = result.rows[0] as InventoryPurchaseRow;
      return reply.status(201).send(serializeInventoryPurchase(row));
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/inventory-purchases',
    {
      preHandler: adminPre,
      schema: {
        description: 'List inventory purchases, optionally filtered by last N days',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: { days: { type: 'string' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                purchase_date: { type: 'string' },
                amount: { type: 'string' },
                notes: { type: 'string' },
                supplier: { type: 'string' },
                category: { type: 'string' },
                purchase_type: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const days = parseDaysQuery(request.query.days);
      const pool = getPool();
      const selectCols =
        'id, purchase_date, amount, notes, supplier, category, purchase_type, created_at';
      let result;
      if (days != null) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);
        result = await pool.query(
          `SELECT ${selectCols}
           FROM inventory_purchases
           WHERE purchase_date >= $1
           ORDER BY purchase_date DESC, created_at DESC`,
          [sinceStr]
        );
      } else {
        result = await pool.query(
          `SELECT ${selectCols}
           FROM inventory_purchases
           ORDER BY purchase_date DESC, created_at DESC`
        );
      }
      const rows = result.rows as InventoryPurchaseRow[];
      return reply.send(rows.map(serializeInventoryPurchase));
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/inventory-invested',
    {
      preHandler: adminPre,
      schema: {
        description: 'Sum of inventory purchase amounts over last N days (for Cash Snapshot)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: { days: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: { total: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const days = parseDaysQuery(request.query.days) ?? 14;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().slice(0, 10);
      const pool = getPool();
      const result = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric::text AS total
         FROM inventory_purchases
         WHERE purchase_date >= $1`,
        [sinceStr]
      );
      const total = (result.rows[0] as { total: string }).total;
      return reply.send({ total });
    }
  );
}
