import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { emitShowPayoutRecorded, resolveActorUserId } from '../services/financial-event-emission';
import {
  loadCompletedShowProfitInDateWindow,
  loadShowFinancialProfit,
  loadShowProfitsForShows,
} from '../services/financial-show-profit';

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
  // Optional explicit platform fee (capture only). Rejected when negative.
  platform_fee_amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        return undefined;
      }
      const n = typeof v === 'string' ? parseFloat(v) : v;
      if (Number.isNaN(n) || n < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'platform_fee_amount must be a non-negative number',
        });
        return z.NEVER;
      }
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
            platform_fee_amount: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              show_id: { type: 'string' },
              payout_after_fees_amount: { type: 'string' },
              gross_sales_amount: { type: 'string' },
              platform_fee_amount: { type: 'string' },
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
      const { payout_after_fees_amount, gross_sales_amount, platform_fee_amount } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const showCheck = await client.query(
          `SELECT id, status, show_date FROM shows WHERE id = $1 AND deleted_at IS NULL`,
          [showId]
        );
        if (showCheck.rows.length === 0) {
          throw new NotFoundError('Show', showId);
        }
        const showRow = showCheck.rows[0] as { status: string; show_date: string };
        if (showRow.status === 'COMPLETED') {
          throw new ConflictError('Show is closed; reopen before editing.');
        }

        const existing = await client.query(
          `SELECT payout_after_fees_amount FROM show_financials WHERE show_id = $1`,
          [showId]
        );
        const isUpdate = existing.rows.length > 0;
        const previousPayout = isUpdate
          ? (existing.rows[0] as { payout_after_fees_amount: string }).payout_after_fees_amount
          : null;

        const result = await client.query(
          `INSERT INTO show_financials (show_id, payout_after_fees_amount, gross_sales_amount, platform_fee_amount, currency, updated_at)
           VALUES ($1, $2, $3, $4, 'USD', NOW())
           ON CONFLICT (show_id) DO UPDATE SET
             payout_after_fees_amount = EXCLUDED.payout_after_fees_amount,
             gross_sales_amount = EXCLUDED.gross_sales_amount,
             -- Preserve existing platform fee when the caller omits it (e.g. payout-only edits).
             platform_fee_amount = COALESCE(EXCLUDED.platform_fee_amount, show_financials.platform_fee_amount),
             updated_at = NOW()
           RETURNING show_id, payout_after_fees_amount, gross_sales_amount, platform_fee_amount, currency, created_at, updated_at`,
          [
            showId,
            payout_after_fees_amount,
            gross_sales_amount ?? null,
            platform_fee_amount ?? null,
          ]
        );
        const inserted = result.rows[0] as {
          show_id: string;
          payout_after_fees_amount: string;
          gross_sales_amount: string | null;
          platform_fee_amount: string | null;
          currency: string;
          created_at: Date;
          updated_at: Date;
        };
        await emitShowPayoutRecorded(
          client,
          {
            showId,
            showDate: showRow.show_date,
            showStatus: showRow.status,
            payoutAfterFeesAmount: inserted.payout_after_fees_amount,
            grossSalesAmount: inserted.gross_sales_amount,
            platformFeeAmount: inserted.platform_fee_amount,
            currency: inserted.currency,
            isUpdate,
            previousPayoutAfterFeesAmount: previousPayout,
            updatedAt: inserted.updated_at,
          },
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });

      const r = row as {
        show_id: string;
        payout_after_fees_amount: string;
        gross_sales_amount: string | null;
        platform_fee_amount: string | null;
        currency: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.send({
        show_id: r.show_id,
        payout_after_fees_amount: r.payout_after_fees_amount,
        gross_sales_amount: r.gross_sales_amount ?? undefined,
        platform_fee_amount: r.platform_fee_amount ?? undefined,
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
              platform_fee_amount: { type: 'string' },
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
        `SELECT show_id, payout_after_fees_amount, gross_sales_amount, platform_fee_amount, currency, created_at, updated_at
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
        platform_fee_amount: string | null;
        currency: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.send({
        show_id: r.show_id,
        payout_after_fees_amount: r.payout_after_fees_amount,
        gross_sales_amount: r.gross_sales_amount ?? undefined,
        platform_fee_amount: r.platform_fee_amount ?? undefined,
        currency: r.currency,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );

  fastify.get<{ Params: { showId: string } }>(
    '/shows/:showId/financial-profit',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Event-derived show profit (payout minus show-linked settlements). Profit is null until show is COMPLETED.',
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
              show_status: { type: 'string' },
              show_date: { type: 'string' },
              payout_after_fees_amount: { type: 'string' },
              owed_total: { type: 'string' },
              profit: { type: ['string', 'null'] },
              settlement_count: { type: 'integer' },
              included_in_profit: { type: 'boolean' },
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

      const profit = await loadShowFinancialProfit(pool, showId);
      if (!profit) {
        throw new NotFoundError('Show financial profit', showId);
      }

      return reply.send({
        show_id: profit.show_id,
        show_status: profit.show_status ?? undefined,
        show_date: profit.show_date ?? undefined,
        payout_after_fees_amount: profit.payout_after_fees_amount,
        owed_total: profit.owed_total,
        profit: profit.profit,
        settlement_count: profit.settlement_count,
        included_in_profit: profit.included_in_profit,
      });
    }
  );

  fastify.get<{ Querystring: { showIds?: string } }>(
    '/shows/financial-profits',
    {
      preHandler: adminPre,
      schema: {
        description: 'Batch event-derived show profit for comma-separated show ids',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['showIds'],
          properties: {
            showIds: { type: 'string', description: 'Comma-separated show UUIDs' },
          },
        },
        response: {
          200: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                show_id: { type: 'string' },
                payout_after_fees_amount: { type: 'string' },
                owed_total: { type: 'string' },
                profit: { type: ['string', 'null'] },
                settlement_count: { type: 'integer' },
                included_in_profit: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const raw = request.query.showIds?.trim() ?? '';
      if (raw === '') {
        throw new ValidationError('showIds query parameter is required');
      }
      const ids = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const id of ids) {
        const parsed = uuidSchema.safeParse(id);
        if (!parsed.success) {
          throw new ValidationError('Invalid showIds', parsed.error.errors);
        }
      }

      const pool = getPool();
      const profits = await loadShowProfitsForShows(pool, ids);
      const body: Record<string, unknown> = {};
      for (const [showId, row] of profits) {
        body[showId] = {
          show_id: row.show_id,
          show_status: row.show_status ?? undefined,
          show_date: row.show_date ?? undefined,
          payout_after_fees_amount: row.payout_after_fees_amount,
          owed_total: row.owed_total,
          profit: row.profit,
          settlement_count: row.settlement_count,
          included_in_profit: row.included_in_profit,
        };
      }
      return reply.send(body);
    }
  );

  fastify.get<{ Querystring: { from: string; to: string } }>(
    '/shows/completed-profit',
    {
      preHandler: adminPre,
      schema: {
        description: 'Sum event-derived profit for COMPLETED shows with show_date in [from, to]',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['from', 'to'],
          properties: {
            from: { type: 'string', format: 'date' },
            to: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              show_count: { type: 'integer' },
              total_profit: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const fromParsed = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .safeParse(request.query.from);
      const toParsed = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .safeParse(request.query.to);
      if (!fromParsed.success || !toParsed.success) {
        throw new ValidationError('from and to must be YYYY-MM-DD dates');
      }
      if (fromParsed.data > toParsed.data) {
        throw new ValidationError('Invalid date range: from must be <= to');
      }

      const pool = getPool();
      const window = await loadCompletedShowProfitInDateWindow(
        pool,
        fromParsed.data,
        toParsed.data
      );
      return reply.send(window);
    }
  );
}
