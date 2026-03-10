import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { ValidationError } from '../utils/errors';

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
});

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
      const { purchase_date, amount, notes } = parsed.data;
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO inventory_purchases (purchase_date, amount, notes)
         VALUES ($1, $2, $3)
         RETURNING id, purchase_date, amount, notes, created_at`,
        [purchase_date, amount, notes ?? null]
      );
      const row = result.rows[0] as {
        id: string;
        purchase_date: string;
        amount: string;
        notes: string | null;
        created_at: Date;
      };
      return reply.status(201).send({
        id: row.id,
        purchase_date: row.purchase_date,
        amount: row.amount,
        notes: row.notes ?? undefined,
        created_at: row.created_at,
      });
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
      let result;
      if (days != null) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);
        result = await pool.query(
          `SELECT id, purchase_date, amount, notes, created_at
           FROM inventory_purchases
           WHERE purchase_date >= $1
           ORDER BY purchase_date DESC, created_at DESC`,
          [sinceStr]
        );
      } else {
        result = await pool.query(
          `SELECT id, purchase_date, amount, notes, created_at
           FROM inventory_purchases
           ORDER BY purchase_date DESC, created_at DESC`
        );
      }
      const rows = result.rows as Array<{
        id: string;
        purchase_date: string;
        amount: string;
        notes: string | null;
        created_at: Date;
      }>;
      return reply.send(
        rows.map((r) => ({
          id: r.id,
          purchase_date: r.purchase_date,
          amount: r.amount,
          notes: r.notes ?? undefined,
          created_at: r.created_at,
        }))
      );
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
