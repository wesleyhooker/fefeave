import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

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
}
