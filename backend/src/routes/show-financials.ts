import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const postFinancialsSchema = z.object({
  payout_after_fees_amount: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n) || n < 0) {
      throw new Error('payout_after_fees_amount must be a non-negative number');
    }
    return n;
  }),
  gross_sales_amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return undefined;
      const n = typeof v === 'string' ? parseFloat(v) : v;
      if (Number.isNaN(n) || n < 0) return undefined;
      return n;
    }),
});

export async function showFinancialsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{
    Params: { showId: string };
    Body: z.infer<typeof postFinancialsSchema>;
  }>(
    '/shows/:showId/financials',
    {
      preHandler: adminPre,
      schema: {
        description: 'Upsert show financials (one per show)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['payout_after_fees_amount'],
          properties: {
            payout_after_fees_amount: { type: 'number' },
            gross_sales_amount: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              show_id: { type: 'string' },
              payout_after_fees_amount: { type: 'string' },
              gross_sales_amount: { type: 'string' },
              currency: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const showIdParsed = uuidSchema.safeParse(request.params.showId);
      if (!showIdParsed.success) {
        throw new ValidationError('Invalid showId', showIdParsed.error.errors);
      }
      const showId = showIdParsed.data;

      const bodyParsed = postFinancialsSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const { payout_after_fees_amount, gross_sales_amount } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const showCheck = await client.query(
          `SELECT id FROM shows WHERE id = $1 AND deleted_at IS NULL`,
          [showId]
        );
        if (showCheck.rows.length === 0) {
          throw new NotFoundError('Show', showId);
        }

        const result = await client.query(
          `INSERT INTO show_financials (show_id, payout_after_fees_amount, gross_sales_amount, currency, updated_at)
           VALUES ($1, $2, $3, 'USD', NOW())
           ON CONFLICT (show_id) DO UPDATE SET
             payout_after_fees_amount = EXCLUDED.payout_after_fees_amount,
             gross_sales_amount = EXCLUDED.gross_sales_amount,
             updated_at = NOW()
           RETURNING show_id, payout_after_fees_amount, gross_sales_amount, currency, created_at, updated_at`,
          [showId, payout_after_fees_amount, gross_sales_amount ?? null]
        );
        return result.rows[0];
      });

      const r = row as {
        show_id: string;
        payout_after_fees_amount: string;
        gross_sales_amount: string | null;
        currency: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.send({
        show_id: r.show_id,
        payout_after_fees_amount: r.payout_after_fees_amount,
        gross_sales_amount: r.gross_sales_amount ?? undefined,
        currency: r.currency,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );

  fastify.get<{ Params: { showId: string } }>(
    '/shows/:showId/financials',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get show financials',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              show_id: { type: 'string' },
              payout_after_fees_amount: { type: 'string' },
              gross_sales_amount: { type: 'string' },
              currency: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.showId);
      if (!parsed.success) {
        throw new ValidationError('Invalid showId', parsed.error.errors);
      }
      const showId = parsed.data;

      const pool = getPool();
      const showCheck = await pool.query(
        `SELECT id FROM shows WHERE id = $1 AND deleted_at IS NULL`,
        [showId]
      );
      if (showCheck.rows.length === 0) {
        throw new NotFoundError('Show', showId);
      }

      const result = await pool.query(
        `SELECT show_id, payout_after_fees_amount, gross_sales_amount, currency, created_at, updated_at
         FROM show_financials WHERE show_id = $1`,
        [showId]
      );
      const row = result.rows[0];
      if (!row) {
        throw new NotFoundError('Show financials', showId);
      }

      const r = row as {
        show_id: string;
        payout_after_fees_amount: string;
        gross_sales_amount: string | null;
        currency: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.send({
        show_id: r.show_id,
        payout_after_fees_amount: r.payout_after_fees_amount,
        gross_sales_amount: r.gross_sales_amount ?? undefined,
        currency: r.currency,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );
}
