import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const SETTLEMENT_METHODS = ['PERCENT_PAYOUT', 'MANUAL'] as const;

const postOwedLineItemSchema = z.object({
  wholesaler_id: z.string().uuid(),
  amount: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (Number.isNaN(n) || n <= 0) {
      throw new Error('amount must be greater than 0');
    }
    return n;
  }),
  description: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'description must not be empty')),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const postSettlementSchema = z
  .object({
    wholesaler_id: z.string().uuid(),
    method: z.enum(SETTLEMENT_METHODS),
    rate_percent: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined && v !== '' ? Number(v) : undefined)),
    amount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === null) return undefined;
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return Number.isNaN(n) ? undefined : n;
      }),
  })
  .refine(
    (data) => {
      if (data.method === 'PERCENT_PAYOUT')
        return data.rate_percent != null && data.rate_percent >= 0 && data.rate_percent <= 100;
      if (data.method === 'MANUAL') return data.amount != null && data.amount > 0;
      return false;
    },
    { message: 'PERCENT_PAYOUT requires rate_percent 0-100; MANUAL requires amount > 0' }
  );

export async function owedLineItemRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{
    Params: { showId: string };
    Body: z.infer<typeof postOwedLineItemSchema>;
  }>(
    '/shows/:showId/owed-line-items',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create an owed line item for a show',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['wholesaler_id', 'amount', 'description'],
          properties: {
            wholesaler_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            description: { type: 'string' },
            due_date: { type: 'string', format: 'date' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              show_id: { type: 'string' },
              wholesaler_id: { type: 'string' },
              amount: { type: 'string' },
              currency: { type: 'string' },
              description: { type: 'string' },
              due_date: { type: 'string' },
              status: { type: 'string' },
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

      const bodyParsed = postOwedLineItemSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const { wholesaler_id, amount, description, due_date } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);

        const showCheck = await client.query(
          `SELECT id FROM shows WHERE id = $1 AND deleted_at IS NULL`,
          [showId]
        );
        if (showCheck.rows.length === 0) {
          throw new NotFoundError('Show', showId);
        }

        const wholesalerCheck = await client.query(
          `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
          [wholesaler_id]
        );
        if (wholesalerCheck.rows.length === 0) {
          throw new NotFoundError('Wholesaler', wholesaler_id);
        }

        const result = await client.query(
          `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, due_date, status, created_by, created_via)
           VALUES ($1, $2, $3, 'USD', $4, $5, 'PENDING', $6, 'API')
           RETURNING id, show_id, wholesaler_id, amount, currency, description, due_date, status, created_at, updated_at`,
          [showId, wholesaler_id, amount, description, due_date ?? null, userId]
        );
        return result.rows[0];
      });

      const r = row as {
        id: string;
        show_id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        description: string;
        due_date: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: r.id,
        show_id: r.show_id,
        wholesaler_id: r.wholesaler_id,
        amount: r.amount,
        currency: r.currency,
        description: r.description,
        due_date: r.due_date ?? undefined,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );

  fastify.get<{ Params: { showId: string } }>(
    '/shows/:showId/owed-line-items',
    {
      preHandler: adminPre,
      schema: {
        description: 'List owed line items for a show',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                show_id: { type: 'string' },
                wholesaler_id: { type: 'string' },
                amount: { type: 'string' },
                currency: { type: 'string' },
                description: { type: 'string' },
                due_date: { type: 'string' },
                status: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
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
        `SELECT id, show_id, wholesaler_id, amount, currency, description, due_date, status, created_at, updated_at
         FROM owed_line_items
         WHERE show_id = $1 AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [showId]
      );

      const rows = result.rows as Array<{
        id: string;
        show_id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        description: string;
        due_date: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>;

      return reply.send(
        rows.map((r) => ({
          id: r.id,
          show_id: r.show_id,
          wholesaler_id: r.wholesaler_id,
          amount: r.amount,
          currency: r.currency,
          description: r.description,
          due_date: r.due_date ?? undefined,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );

  // --- Settlements (owed_line_items with calculation_method) ---

  fastify.post<{
    Params: { showId: string };
    Body: z.infer<typeof postSettlementSchema>;
  }>(
    '/shows/:showId/settlements',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a settlement obligation for a show',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['wholesaler_id', 'method'],
          properties: {
            wholesaler_id: { type: 'string', format: 'uuid' },
            method: { type: 'string', enum: SETTLEMENT_METHODS },
            rate_percent: { type: 'number' },
            amount: { type: 'number' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              show_id: { type: 'string' },
              wholesaler_id: { type: 'string' },
              amount: { type: 'string' },
              currency: { type: 'string' },
              calculation_method: { type: 'string' },
              rate_bps: { type: 'number' },
              base_amount: { type: 'string' },
              status: { type: 'string' },
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

      const bodyParsed = postSettlementSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const { wholesaler_id, method, rate_percent, amount: amountRaw } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);

        const showCheck = await client.query(
          `SELECT id FROM shows WHERE id = $1 AND deleted_at IS NULL`,
          [showId]
        );
        if (showCheck.rows.length === 0) {
          throw new NotFoundError('Show', showId);
        }

        const wholesalerCheck = await client.query(
          `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
          [wholesaler_id]
        );
        if (wholesalerCheck.rows.length === 0) {
          throw new NotFoundError('Wholesaler', wholesaler_id);
        }

        const rate_bps = method === 'PERCENT_PAYOUT' ? Math.round((rate_percent ?? 0) * 100) : null;
        const description =
          method === 'PERCENT_PAYOUT' ? 'Settlement (percent)' : 'Settlement (manual)';

        if (method === 'PERCENT_PAYOUT') {
          const finCheck = await client.query(`SELECT 1 FROM show_financials WHERE show_id = $1`, [
            showId,
          ]);
          if (finCheck.rows.length === 0) {
            throw new ConflictError(
              'Show financials not found for this show. Add financials before creating a percent-based settlement.'
            );
          }
          const result = await client.query(
            `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
             SELECT $1, $2, ROUND(sf.payout_after_fees_amount * $3 / 10000, 4), 'USD', $4, 'PENDING', $5, 'API', 'PERCENT_PAYOUT', $3, sf.payout_after_fees_amount
             FROM show_financials sf WHERE sf.show_id = $1
             RETURNING id, show_id, wholesaler_id, amount, currency, calculation_method, rate_bps, base_amount, status, created_at, updated_at`,
            [showId, wholesaler_id, rate_bps, description, userId]
          );
          return result.rows[0];
        }

        const amount =
          (typeof amountRaw === 'string' ? parseFloat(amountRaw) : (amountRaw as number)) ?? 0;
        if (Number.isNaN(amount) || amount <= 0) {
          throw new ValidationError('MANUAL settlement requires amount > 0');
        }
        const result = await client.query(
          `INSERT INTO owed_line_items (show_id, wholesaler_id, amount, currency, description, status, created_by, created_via, calculation_method, rate_bps, base_amount)
           VALUES ($1, $2, $3, 'USD', $4, 'PENDING', $5, 'API', 'MANUAL', NULL, NULL)
           RETURNING id, show_id, wholesaler_id, amount, currency, calculation_method, rate_bps, base_amount, status, created_at, updated_at`,
          [showId, wholesaler_id, amount, description, userId]
        );
        return result.rows[0];
      });

      const r = row as {
        id: string;
        show_id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        calculation_method: string;
        rate_bps: number | null;
        base_amount: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: r.id,
        show_id: r.show_id,
        wholesaler_id: r.wholesaler_id,
        amount: r.amount,
        currency: r.currency,
        calculation_method: r.calculation_method,
        rate_bps: r.rate_bps ?? undefined,
        base_amount: r.base_amount ?? undefined,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
      });
    }
  );

  fastify.get<{ Params: { showId: string } }>(
    '/shows/:showId/settlements',
    {
      preHandler: adminPre,
      schema: {
        description: 'List settlement obligations for a show',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                show_id: { type: 'string' },
                wholesaler_id: { type: 'string' },
                amount: { type: 'string' },
                currency: { type: 'string' },
                calculation_method: { type: 'string' },
                rate_bps: { type: 'number' },
                base_amount: { type: 'string' },
                status: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
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
        `SELECT id, show_id, wholesaler_id, amount, currency, calculation_method, rate_bps, base_amount, status, created_at, updated_at
         FROM owed_line_items
         WHERE show_id = $1 AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [showId]
      );

      const rows = result.rows as Array<{
        id: string;
        show_id: string;
        wholesaler_id: string;
        amount: string;
        currency: string;
        calculation_method: string;
        rate_bps: number | null;
        base_amount: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
      }>;

      return reply.send(
        rows.map((r) => ({
          id: r.id,
          show_id: r.show_id,
          wholesaler_id: r.wholesaler_id,
          amount: r.amount,
          currency: r.currency,
          calculation_method: r.calculation_method,
          rate_bps: r.rate_bps ?? undefined,
          base_amount: r.base_amount ?? undefined,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );
}
