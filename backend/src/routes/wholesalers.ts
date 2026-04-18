import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { readUnpaidClosedShowsForWholesaler } from '../read-models/unpaid-closed-shows';
import { getWholesalerBalancesView } from '../services/balancesView';
import { getWholesalerStatement } from '../services/wholesaler-statement';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

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

const postLinkUserSchema = z.object({
  userId: z.string().min(1),
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
         RETURNING id, name, contact_email, contact_phone, notes, pay_schedule, created_at, updated_at`,
        [name, email, contact_phone ?? null, notes ?? null]
      );
      const row = result.rows[0] as {
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        pay_schedule: string;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: row.id,
        name: row.name,
        contact_email: row.contact_email ?? undefined,
        contact_phone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        pay_schedule: row.pay_schedule ?? 'AD_HOC',
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
                pay_schedule: { type: 'string', enum: ['AD_HOC', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const pool = getPool();
      try {
        const rows = await getWholesalerBalancesView(pool, {
          sortKey: 'name',
          sortDir: 'asc',
        });
        return reply.send(
          rows.map((r) => ({
            wholesaler_id: r.wholesaler_id,
            name: r.wholesaler_name,
            owed_total: r.owed_total,
            paid_total: r.paid_total,
            balance_owed: r.balance_owed,
            last_payment_date: r.last_payment_date ?? undefined,
            pay_schedule: r.pay_schedule ?? 'AD_HOC',
          }))
        );
      } catch (error) {
        // During fresh env bootstrap, migrations may not be applied yet.
        if ((error as { code?: string }).code === '42P01') {
          request.log.warn({ error }, 'wholesaler tables missing; returning empty balances');
          return reply.send([]);
        }
        throw error;
      }
    }
  );

  // ---------------------------------------------------------------------------
  // Admin provisioning endpoints
  // ---------------------------------------------------------------------------
  // This endpoint lives in wholesaler routes (instead of a separate admin module)
  // because it provisions identity linkage to a wholesaler domain object.
  // API contract/guards are intentionally stable for compatibility.
  fastify.post<{
    Params: { id: string };
    Body: z.infer<typeof postLinkUserSchema>;
  }>(
    '/admin/wholesalers/:id/link-user',
    {
      preHandler: adminPre,
      schema: {
        description: 'Link a user to a wholesaler for portal ownership',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['userId'],
          properties: { userId: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              wholesaler_id: { type: 'string' },
              user_id: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const wholesalerIdParsed = uuidSchema.safeParse(request.params.id);
      if (!wholesalerIdParsed.success) {
        throw new ValidationError('Invalid wholesaler id', wholesalerIdParsed.error.errors);
      }
      const bodyParsed = postLinkUserSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }

      const wholesalerId = wholesalerIdParsed.data;
      const userRef = bodyParsed.data.userId.trim();
      const pool = getPool();

      const wholesalerResult = await pool.query(
        `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
        [wholesalerId]
      );
      if (wholesalerResult.rows.length === 0) {
        throw new NotFoundError('Wholesaler', wholesalerId);
      }

      const userIdAsUuid = uuidSchema.safeParse(userRef);
      const userResult = userIdAsUuid.success
        ? await pool.query(
            `SELECT id, cognito_user_id, wholesaler_id
             FROM users
             WHERE (id = $1 OR cognito_user_id = $2) AND deleted_at IS NULL
             LIMIT 1`,
            [userRef, userRef]
          )
        : await pool.query(
            `SELECT id, cognito_user_id, wholesaler_id
             FROM users
             WHERE cognito_user_id = $1 AND deleted_at IS NULL
             LIMIT 1`,
            [userRef]
          );
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User', userRef);
      }
      const user = userResult.rows[0] as {
        id: string;
        cognito_user_id: string;
        wholesaler_id: string | null;
      };

      if (user.wholesaler_id && user.wholesaler_id !== wholesalerId) {
        throw new ConflictError('User is already linked to another wholesaler');
      }

      const existingWholesalerLink = await pool.query(
        `SELECT id, cognito_user_id
         FROM users
         WHERE wholesaler_id = $1 AND deleted_at IS NULL AND id <> $2
         LIMIT 1`,
        [wholesalerId, user.id]
      );
      if (existingWholesalerLink.rows.length > 0) {
        throw new ConflictError('Wholesaler is already linked to another user');
      }

      await pool.query(
        `UPDATE users
         SET wholesaler_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [wholesalerId, user.id]
      );

      return reply.send({
        ok: true,
        wholesaler_id: wholesalerId,
        user_id: user.id,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // Core wholesaler CRUD/read endpoints
  // ---------------------------------------------------------------------------
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
                pay_schedule: { type: 'string' },
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
        `SELECT id, name, contact_email, contact_phone, notes, pay_schedule, created_at, updated_at
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
        pay_schedule: string;
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
          pay_schedule: r.pay_schedule ?? 'AD_HOC',
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );

  const patchWholesalerSchema = z.object({
    pay_schedule: z.enum(['AD_HOC', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  });

  fastify.patch<{ Params: { id: string }; Body: z.infer<typeof patchWholesalerSchema> }>(
    '/wholesalers/:id',
    {
      preHandler: adminPre,
      schema: {
        description: 'Update wholesaler (e.g. pay_schedule)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['pay_schedule'],
          properties: {
            pay_schedule: { type: 'string', enum: ['AD_HOC', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              contact_email: { type: 'string' },
              contact_phone: { type: 'string' },
              notes: { type: 'string' },
              pay_schedule: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        throw new ValidationError('Invalid wholesaler id', idParsed.error.errors);
      }
      const bodyParsed = patchWholesalerSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const id = idParsed.data;
      const { pay_schedule } = bodyParsed.data;

      const pool = getPool();
      const result = await pool.query(
        `UPDATE wholesalers SET pay_schedule = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL
         RETURNING id, name, contact_email, contact_phone, notes, pay_schedule, created_at, updated_at`,
        [pay_schedule, id]
      );
      const row = result.rows[0] as
        | {
            id: string;
            name: string;
            contact_email: string | null;
            contact_phone: string | null;
            notes: string | null;
            pay_schedule: string;
            created_at: Date;
            updated_at: Date;
          }
        | undefined;
      if (!row) {
        throw new NotFoundError('Wholesaler', id);
      }
      return reply.send({
        id: row.id,
        name: row.name,
        contact_email: row.contact_email ?? undefined,
        contact_phone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        pay_schedule: row.pay_schedule,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/wholesalers/:id/unpaid-closed-shows',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Closed shows contributing to outstanding for a wholesaler (batch-pay drilldown)',
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
                show_id: { type: 'string' },
                show_name: { type: 'string' },
                show_date: { type: 'string' },
                owed_total: { type: 'string' },
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
        `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
        [wholesalerId]
      );
      if (whCheck.rows.length === 0) {
        throw new NotFoundError('Wholesaler', wholesalerId);
      }
      const rows = await readUnpaidClosedShowsForWholesaler(pool, wholesalerId);
      return reply.send(rows);
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/wholesalers/:id/closed-shows-in-balance',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Alias for closed shows contributing to outstanding for a wholesaler (batch-pay drilldown)',
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
                show_id: { type: 'string' },
                show_name: { type: 'string' },
                show_date: { type: 'string' },
                owed_total: { type: 'string' },
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
        `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
        [wholesalerId]
      );
      if (whCheck.rows.length === 0) {
        throw new NotFoundError('Wholesaler', wholesalerId);
      }
      const rows = await readUnpaidClosedShowsForWholesaler(pool, wholesalerId);
      return reply.send(rows);
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
                entry_id: { type: 'string' },
                ledger_entry_kind: {
                  type: 'string',
                  enum: ['SHOW_OBLIGATION', 'VENDOR_EXPENSE', 'PAYMENT'],
                },
                obligation_kind: { type: 'string', enum: ['SHOW_LINKED', 'VENDOR_EXPENSE'] },
                calculation_method: { type: 'string' },
                show_name: { type: 'string' },
                description: { type: 'string' },
                lines: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      item_name: { type: 'string' },
                      quantity: { type: 'integer' },
                      unit_price_cents: { type: 'integer' },
                      line_total_cents: { type: 'integer' },
                    },
                  },
                },
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
      const entries = await getWholesalerStatement(pool, wholesalerId);
      return reply.send(entries);
    }
  );
}
