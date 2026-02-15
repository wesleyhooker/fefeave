import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const postPaymentSchema = z.object({
  wholesaler_id: z.string().uuid(),
  amount: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n) || n <= 0) {
      throw new Error('amount must be greater than 0');
    }
    return n;
  }),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'payment_date must be YYYY-MM-DD'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function paymentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postPaymentSchema> }>(
    '/payments',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a payment',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['wholesaler_id', 'amount', 'payment_date'],
          properties: {
            wholesaler_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            payment_date: { type: 'string', format: 'date' },
            reference: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              wholesaler_id: { type: 'string' },
              amount: { type: 'string' },
              currency: { type: 'string' },
              payment_date: { type: 'string' },
              reference: { type: 'string' },
              notes: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postPaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { wholesaler_id, amount, payment_date, reference, notes } = parsed.data;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);

        const wholesalerCheck = await client.query(
          `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
          [wholesaler_id]
        );
        if (wholesalerCheck.rows.length === 0) {
          throw new NotFoundError('Wholesaler', wholesaler_id);
        }

        const result = await client.query(
          `INSERT INTO payments (wholesaler_id, amount, currency, payment_date, payment_method, reference, notes, created_by, created_via)
           VALUES ($1, $2, 'USD', $3, 'OTHER', $4, $5, $6, 'API')
           RETURNING id, wholesaler_id, amount, currency, payment_date, reference, notes, created_at, updated_at`,
          [wholesaler_id, amount, payment_date, reference ?? null, notes ?? null, userId]
        );
        return result.rows[0];
      });

      const r = row as {
        id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        payment_date: string;
        reference: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: r.id,
        wholesaler_id: r.wholesaler_id,
        amount: r.amount,
        currency: r.currency,
        payment_date: r.payment_date,
        reference: r.reference ?? undefined,
        notes: r.notes ?? undefined,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );

  fastify.get<{ Querystring: { wholesaler_id?: string } }>(
    '/payments',
    {
      preHandler: adminPre,
      schema: {
        description: 'List payments, optionally by wholesaler',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: { wholesaler_id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                wholesaler_id: { type: 'string' },
                amount: { type: 'string' },
                currency: { type: 'string' },
                payment_date: { type: 'string' },
                reference: { type: 'string' },
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
      const { wholesaler_id } = request.query;
      if (wholesaler_id) {
        const parsed = uuidSchema.safeParse(wholesaler_id);
        if (!parsed.success) {
          throw new ValidationError('Invalid wholesaler_id', parsed.error.errors);
        }
      }

      const pool = getPool();
      let result;
      if (wholesaler_id) {
        result = await pool.query(
          `SELECT id, wholesaler_id, amount, currency, payment_date, reference, notes, created_at, updated_at
           FROM payments
           WHERE wholesaler_id = $1 AND deleted_at IS NULL
           ORDER BY payment_date DESC, created_at DESC`,
          [wholesaler_id]
        );
      } else {
        result = await pool.query(
          `SELECT id, wholesaler_id, amount, currency, payment_date, reference, notes, created_at, updated_at
           FROM payments
           WHERE deleted_at IS NULL
           ORDER BY payment_date DESC, created_at DESC`
        );
      }

      const rows = result.rows as Array<{
        id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        payment_date: string;
        reference: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>;

      return reply.send(
        rows.map((r) => ({
          id: r.id,
          wholesaler_id: r.wholesaler_id,
          amount: r.amount,
          currency: r.currency,
          payment_date: r.payment_date,
          reference: r.reference ?? undefined,
          notes: r.notes ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );
}
