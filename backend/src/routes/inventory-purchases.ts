import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import {
  DEFAULT_INVENTORY_PAYMENT_STATUS,
  INVENTORY_PAYMENT_STATUSES,
} from '../constants/inventory-acquisition';
import { loadInventoryInvestedWindowTotal } from '../services/financial-event-summaries';
import {
  createInventoryAcquisition,
  type InventoryAcquisitionRow,
} from '../services/inventory-acquisition';
import { resolveActorUserId } from '../services/financial-event-emission';
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

const postInventoryPurchaseSchema = z
  .object({
    purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'purchase_date must be YYYY-MM-DD'),
    amount: z.union([z.string(), z.number()]).transform((v) => {
      const n = typeof v === 'string' ? parseFloat(v) : v;
      if (Number.isNaN(n) || n <= 0) {
        throw new Error('amount must be greater than 0');
      }
      return n;
    }),
    notes: z.string().optional(),
    supplier: optionalTrimmedText,
    category: z.preprocess(blankToUndefined, z.enum(INVENTORY_CATEGORIES).optional()),
    purchase_type: z.preprocess(blankToUndefined, z.enum(INVENTORY_PURCHASE_TYPES).optional()),
    payment_status: z
      .enum(INVENTORY_PAYMENT_STATUSES)
      .optional()
      .default(DEFAULT_INVENTORY_PAYMENT_STATUS),
    wholesaler_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_status === 'OWE_VENDOR' && !data.wholesaler_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'wholesaler_id is required when payment_status is OWE_VENDOR',
        path: ['wholesaler_id'],
      });
    }
    if (data.payment_status === 'PAID_NOW' && data.wholesaler_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'wholesaler_id must be omitted when payment_status is PAID_NOW',
        path: ['wholesaler_id'],
      });
    }
  });

function serializeInventoryPurchase(row: InventoryAcquisitionRow) {
  return {
    id: row.id,
    purchase_date: toYyyyMmDd(row.purchase_date),
    amount: row.amount,
    notes: row.notes ?? undefined,
    supplier: row.supplier ?? undefined,
    category: row.category ?? undefined,
    purchase_type: row.purchase_type ?? undefined,
    payment_status: row.payment_status,
    wholesaler_id: row.wholesaler_id ?? undefined,
    vendor_obligation_id: row.vendor_obligation_id ?? undefined,
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
        description:
          'Record inventory purchase (paid now = cash outflow; owe vendor = vendor obligation)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['purchase_date', 'amount'],
          properties: {
            purchase_date: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            notes: { type: 'string' },
            supplier: { type: 'string' },
            category: {
              type: 'string',
              description: `One of: ${INVENTORY_CATEGORIES.join(', ')}`,
            },
            purchase_type: {
              type: 'string',
              description: `One of: ${INVENTORY_PURCHASE_TYPES.join(', ')}`,
            },
            payment_status: {
              type: 'string',
              description: `One of: ${INVENTORY_PAYMENT_STATUSES.join(', ')}`,
            },
            wholesaler_id: { type: 'string', format: 'uuid' },
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
              payment_status: { type: 'string' },
              wholesaler_id: { type: 'string' },
              vendor_obligation_id: { type: 'string' },
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
      const {
        purchase_date,
        amount,
        notes,
        supplier,
        category,
        purchase_type,
        payment_status,
        wholesaler_id,
      } = parsed.data;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);
        return createInventoryAcquisition(client, {
          purchase_date,
          amount,
          notes: notes ?? null,
          supplier: supplier ?? null,
          category: category ?? null,
          purchase_type: purchase_type ?? null,
          payment_status,
          wholesaler_id: wholesaler_id ?? null,
          created_by: userId,
          actor_user_id: resolveActorUserId(request.user?.cognitoSub),
        });
      });

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
                payment_status: { type: 'string' },
                wholesaler_id: { type: 'string' },
                vendor_obligation_id: { type: 'string' },
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
        'id, purchase_date, amount, notes, supplier, category, purchase_type, payment_status, wholesaler_id, vendor_obligation_id, created_at';
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
      const rows = result.rows as InventoryAcquisitionRow[];
      return reply.send(rows.map(serializeInventoryPurchase));
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/inventory-invested',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Sum of inventory purchase amounts over last N days from financial_events (all payment statuses)',
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
      const pool = getPool();
      const result = await loadInventoryInvestedWindowTotal(pool, days);
      return reply.send(result);
    }
  );
}
