import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const postWholesalerSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'name must not be empty')),
  contact_email: z.union([z.string().email(), z.literal('')]).optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function wholesalerRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postWholesalerSchema> }>(
    '/wholesalers',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a wholesaler',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            contact_email: { type: 'string' },
            contact_phone: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              contact_email: { type: 'string' },
              contact_phone: { type: 'string' },
              notes: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postWholesalerSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { name, contact_email, contact_phone, notes } = parsed.data;
      const email = contact_email?.trim() || null;

      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO wholesalers (name, contact_email, contact_phone, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, contact_email, contact_phone, notes, created_at, updated_at`,
        [name, email, contact_phone ?? null, notes ?? null]
      );
      const row = result.rows[0] as {
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: row.id,
        name: row.name,
        contact_email: row.contact_email ?? undefined,
        contact_phone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );

  fastify.get(
    '/wholesalers/balances',
    {
      preHandler: adminPre,
      schema: {
        description: 'Wholesaler ledger balances: owed_total, paid_total, balance_owed',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                wholesaler_id: { type: 'string' },
                name: { type: 'string' },
                owed_total: { type: 'string' },
                paid_total: { type: 'string' },
                balance_owed: { type: 'string' },
                last_payment_date: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT w.id AS wholesaler_id, w.name,
         (SELECT COALESCE(SUM(amount), 0)::numeric FROM owed_line_items WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS owed_total,
         (SELECT COALESCE(SUM(amount), 0)::numeric FROM payments WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS paid_total,
         (SELECT MAX(payment_date) FROM payments WHERE wholesaler_id = w.id AND deleted_at IS NULL) AS last_payment_date
         FROM wholesalers w
         WHERE w.deleted_at IS NULL`
      );
      const rows = result.rows as Array<{
        wholesaler_id: string;
        name: string;
        owed_total: string;
        paid_total: string;
        last_payment_date: string | null;
      }>;
      return reply.send(
        rows.map((r) => {
          const owed = parseFloat(r.owed_total);
          const paid = parseFloat(r.paid_total);
          const balance = (owed - paid).toFixed(4);
          return {
            wholesaler_id: r.wholesaler_id,
            name: r.name,
            owed_total: r.owed_total,
            paid_total: r.paid_total,
            balance_owed: balance,
            last_payment_date: r.last_payment_date ?? undefined,
          };
        })
      );
    }
  );

  fastify.get(
    '/wholesalers',
    {
      preHandler: adminPre,
      schema: {
        description: 'List wholesalers',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                contact_email: { type: 'string' },
                contact_phone: { type: 'string' },
                notes: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, name, contact_email, contact_phone, notes, created_at, updated_at
         FROM wholesalers
         WHERE deleted_at IS NULL
         ORDER BY LOWER(name) ASC`
      );
      const rows = result.rows as Array<{
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>;
      return reply.send(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          contact_email: r.contact_email ?? undefined,
          contact_phone: r.contact_phone ?? undefined,
          notes: r.notes ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/wholesalers/:id/statement',
    {
      preHandler: adminPre,
      schema: {
        description: 'Ledger statement for a wholesaler: OWED and PAYMENT entries',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['OWED', 'PAYMENT'] },
                date: { type: 'string' },
                amount: { type: 'string' },
                show_id: { type: 'string' },
                running_balance: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.id);
      if (!parsed.success) {
        throw new ValidationError('Invalid wholesaler id', parsed.error.errors);
      }
      const wholesalerId = parsed.data;

      const pool = getPool();
      const whCheck = await pool.query(
        `SELECT id, name FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
        [wholesalerId]
      );
      if (whCheck.rows.length === 0) {
        throw new NotFoundError('Wholesaler', wholesalerId);
      }

      const result = await pool.query(
        `(SELECT 'OWED' AS type, oli.created_at::date AS date, oli.amount, oli.show_id, oli.created_at, oli.id AS entry_id
          FROM owed_line_items oli
          WHERE oli.wholesaler_id = $1 AND oli.deleted_at IS NULL)
         UNION ALL
         (SELECT 'PAYMENT' AS type, p.payment_date AS date, p.amount, NULL::uuid AS show_id, p.created_at, p.id AS entry_id
          FROM payments p
          WHERE p.wholesaler_id = $1 AND p.deleted_at IS NULL)
         ORDER BY date ASC, created_at ASC, entry_id ASC`,
        [wholesalerId]
      );

      const rows = result.rows as Array<{
        type: string;
        date: string;
        amount: string;
        show_id: string | null;
        created_at: Date;
        entry_id: string;
      }>;

      let running = 0;
      const entries = rows.map((r) => {
        const amt = parseFloat(r.amount);
        if (r.type === 'OWED') running += amt;
        else running -= amt;
        return {
          type: r.type as 'OWED' | 'PAYMENT',
          date: r.date,
          amount: r.amount,
          show_id: r.show_id ?? undefined,
          running_balance: running.toFixed(4),
        };
      });

      return reply.send(entries);
    }
  );
}
