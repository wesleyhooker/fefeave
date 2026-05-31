import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { EXPENSE_CATEGORIES } from '../constants/expenses';
import { getPool, withTx } from '../db';
import { ValidationError } from '../utils/errors';
import { toYyyyMmDd } from '../utils/pg-date';
import {
  emitBusinessExpenseRecorded,
  resolveActorUserId,
} from '../services/financial-event-emission';

const optionalTrimmedNotes = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().max(2000).optional());

const postBusinessExpenseSchema = z.object({
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expense_date must be YYYY-MM-DD'),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? parseFloat(v) : v))
    .pipe(
      z
        .number({
          invalid_type_error: 'amount must be a number',
          required_error: 'amount is required',
        })
        .positive('amount must be greater than 0')
    ),
  category: z.enum(EXPENSE_CATEGORIES),
  notes: optionalTrimmedNotes,
});

interface BusinessExpenseRow {
  id: string;
  expense_date: string;
  amount: string;
  category: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function serializeBusinessExpense(row: BusinessExpenseRow) {
  return {
    id: row.id,
    expense_date: toYyyyMmDd(row.expense_date),
    amount: row.amount,
    category: row.category,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseDaysQuery(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

export async function businessExpenseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postBusinessExpenseSchema> }>(
    '/business-expenses',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a business expense (overhead, not inventory or settlements)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['expense_date', 'amount'],
          properties: {
            expense_date: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            category: {
              type: 'string',
              description: `One of: ${EXPENSE_CATEGORIES.join(', ')}`,
            },
            notes: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              expense_date: { type: 'string' },
              amount: { type: 'string' },
              category: { type: 'string' },
              notes: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postBusinessExpenseSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { expense_date, amount, category, notes } = parsed.data;
      const row = await withTx(async (client) => {
        const result = await client.query(
          `INSERT INTO business_expenses (expense_date, amount, category, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id, expense_date, amount, category, notes, created_at, updated_at`,
          [expense_date, amount, category, notes ?? null]
        );
        const inserted = result.rows[0] as BusinessExpenseRow;
        await emitBusinessExpenseRecorded(
          client,
          inserted,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });
      return reply.status(201).send(serializeBusinessExpense(row));
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/business-expenses',
    {
      preHandler: adminPre,
      schema: {
        description: 'List business expenses, optionally filtered by last N days',
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
                expense_date: { type: 'string' },
                amount: { type: 'string' },
                category: { type: 'string' },
                notes: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const days = parseDaysQuery(request.query.days);
      const pool = getPool();
      const selectCols = 'id, expense_date, amount, category, notes, created_at, updated_at';
      let result;
      if (days != null) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);
        result = await pool.query(
          `SELECT ${selectCols}
           FROM business_expenses
           WHERE expense_date >= $1
           ORDER BY expense_date DESC, created_at DESC`,
          [sinceStr]
        );
      } else {
        result = await pool.query(
          `SELECT ${selectCols}
           FROM business_expenses
           ORDER BY expense_date DESC, created_at DESC`
        );
      }
      const rows = result.rows as BusinessExpenseRow[];
      return reply.send(rows.map(serializeBusinessExpense));
    }
  );

  fastify.get<{ Querystring: { days?: string } }>(
    '/admin/business-expenses-total',
    {
      preHandler: adminPre,
      schema: {
        description: 'Sum of business expense amounts over last N days (for Financials Overview)',
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
      const days = parseDaysQuery(request.query.days) ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().slice(0, 10);
      const pool = getPool();
      const result = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::numeric::text AS total
         FROM business_expenses
         WHERE expense_date >= $1`,
        [sinceStr]
      );
      const total = (result.rows[0] as { total: string }).total;
      return reply.send({ total });
    }
  );
}
