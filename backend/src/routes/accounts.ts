import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const accountTypeSchema = z.enum(['OWNER', 'WHOLESALER']);
const accountStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

const createAccountSchema = z.object({
  displayName: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'displayName must not be empty')),
  type: accountTypeSchema.optional(),
  contactName: z.string().optional(),
  contactEmail: z.union([z.string().email(), z.literal('')]).optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

const patchAccountSchema = z
  .object({
    displayName: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'displayName must not be empty'))
      .optional(),
    status: accountStatusSchema.optional(),
    contactName: z.string().optional(),
    contactEmail: z.union([z.string().email(), z.literal('')]).optional(),
    contactPhone: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => {
    return (
      d.displayName != null ||
      d.status != null ||
      d.contactName !== undefined ||
      d.contactEmail !== undefined ||
      d.contactPhone !== undefined ||
      d.notes !== undefined
    );
  }, 'Provide at least one field to update');

const linkUserSchema = z.object({
  userId: z.string().min(1),
});

export async function accountRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get<{
    Querystring: {
      type?: 'OWNER' | 'WHOLESALER';
      status?: 'ACTIVE' | 'ARCHIVED';
      search?: string;
    };
  }>(
    '/accounts',
    {
      preHandler: adminPre,
      schema: {
        description: 'List financial accounts (owner and wholesaler)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const type = request.query.type ?? null;
      const status = request.query.status ?? null;
      const search = request.query.search?.trim() ?? '';
      const searchLike = search === '' ? null : `%${search.toLowerCase()}%`;

      if (type && !accountTypeSchema.safeParse(type).success) {
        throw new ValidationError('Invalid type');
      }
      if (status && !accountStatusSchema.safeParse(status).success) {
        throw new ValidationError('Invalid status');
      }

      const pool = getPool();
      const result = await pool.query(
        `SELECT
           a.id,
           a.display_name,
           a.type::text AS type,
           a.linked_user_id,
           u.email AS linked_user_email,
           a.status::text AS status,
           a.contact_name,
           a.contact_email,
           a.contact_phone,
           a.notes,
           a.legacy_wholesaler_id,
           a.created_at,
           a.updated_at,
           COALESCE((
             SELECT SUM(oli.amount)::numeric
             FROM owed_line_items oli
             WHERE oli.account_id = a.id
               AND oli.deleted_at IS NULL
           ), 0::numeric) AS owed_total,
           COALESCE((
             SELECT SUM(p.amount)::numeric
             FROM payments p
             WHERE p.account_id = a.id
               AND p.deleted_at IS NULL
           ), 0::numeric) AS paid_total,
           (
             SELECT MAX(p.payment_date)::date
             FROM payments p
             WHERE p.account_id = a.id
               AND p.deleted_at IS NULL
           ) AS last_payment_date,
           COALESCE((
             SELECT SUM(osp.amount)::numeric
             FROM owner_self_pay_transactions osp
             WHERE osp.account_id = a.id
               AND osp.deleted_at IS NULL
               AND osp.voided_at IS NULL
           ), 0::numeric) AS self_pay_total,
           (
             SELECT MAX(osp.paid_at)
             FROM owner_self_pay_transactions osp
             WHERE osp.account_id = a.id
               AND osp.deleted_at IS NULL
               AND osp.voided_at IS NULL
           ) AS last_self_pay_at
         FROM accounts a
         LEFT JOIN users u ON u.id = a.linked_user_id AND u.deleted_at IS NULL
         WHERE a.deleted_at IS NULL
           AND ($1::account_type IS NULL OR a.type = $1::account_type)
           AND ($2::account_status IS NULL OR a.status = $2::account_status)
           AND (
             $3::text IS NULL
             OR LOWER(a.display_name) LIKE $3::text
             OR LOWER(COALESCE(u.email, '')) LIKE $3::text
           )
         ORDER BY
           CASE WHEN a.type = 'OWNER' THEN 0 ELSE 1 END ASC,
           LOWER(a.display_name) ASC,
           a.id ASC`,
        [type, status, searchLike]
      );

      const rows = result.rows as Array<{
        id: string;
        display_name: string;
        type: 'OWNER' | 'WHOLESALER';
        linked_user_id: string | null;
        linked_user_email: string | null;
        status: 'ACTIVE' | 'ARCHIVED';
        contact_name: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        legacy_wholesaler_id: string | null;
        created_at: Date;
        updated_at: Date;
        owed_total: string;
        paid_total: string;
        last_payment_date: string | null;
        self_pay_total: string;
        last_self_pay_at: Date | string | null;
      }>;

      return reply.send(
        rows.map((r) => {
          const owed = Number(r.owed_total || 0);
          const paid = Number(r.paid_total || 0);
          return {
            id: r.id,
            displayName: r.display_name,
            type: r.type,
            linkedUserId: r.linked_user_id ?? undefined,
            linkedUserEmail: r.linked_user_email ?? undefined,
            status: r.status,
            contactName: r.contact_name ?? undefined,
            contactEmail: r.contact_email ?? undefined,
            contactPhone: r.contact_phone ?? undefined,
            notes: r.notes ?? undefined,
            wholesalerId: r.legacy_wholesaler_id ?? undefined,
            owedTotal: r.owed_total,
            paidTotal: r.paid_total,
            balanceOwed: (owed - paid).toFixed(4),
            lastPaymentDate: r.last_payment_date ?? undefined,
            selfPayTotal: r.self_pay_total,
            lastSelfPayAt:
              r.last_self_pay_at != null ? new Date(r.last_self_pay_at).toISOString() : undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        })
      );
    }
  );

  fastify.post<{ Body: z.infer<typeof createAccountSchema> }>(
    '/accounts',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a financial account',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = createAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const type = parsed.data.type ?? 'WHOLESALER';
      if (type === 'OWNER') {
        throw new ValidationError('Owner accounts are system-managed and cannot be created here');
      }
      const contactName = parsed.data.contactName?.trim() || null;
      const contactEmail = parsed.data.contactEmail?.trim() || null;
      const contactPhone = parsed.data.contactPhone?.trim() || null;
      const notes = parsed.data.notes?.trim() || null;
      const displayName = parsed.data.displayName;

      const row = await withTx(async (client) => {
        let wholesalerId: string | null = null;
        if (type === 'WHOLESALER') {
          const wholesalerResult = await client.query(
            `INSERT INTO wholesalers (name, contact_email, contact_phone, notes, pay_schedule)
             VALUES ($1, $2, $3, $4, 'AD_HOC')
             RETURNING id`,
            [displayName, contactEmail, contactPhone, notes]
          );
          wholesalerId = (wholesalerResult.rows[0] as { id: string }).id;
        }

        const result = await client.query(
          `INSERT INTO accounts (
             display_name, type, linked_user_id, status, contact_name, contact_email, contact_phone, notes, legacy_wholesaler_id, pay_schedule
           )
           VALUES ($1, $2, NULL, 'ACTIVE', $3, $4, $5, $6, $7, CASE WHEN $2 = 'WHOLESALER'::account_type THEN 'AD_HOC'::pay_schedule ELSE NULL END)
           RETURNING id, display_name, type::text AS type, linked_user_id, status::text AS status, contact_name, contact_email, contact_phone, notes, legacy_wholesaler_id, created_at, updated_at`,
          [displayName, type, contactName, contactEmail, contactPhone, notes, wholesalerId]
        );
        const created = result.rows[0] as {
          id: string;
          display_name: string;
          type: 'OWNER' | 'WHOLESALER';
          linked_user_id: string | null;
          status: 'ACTIVE' | 'ARCHIVED';
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          legacy_wholesaler_id: string | null;
          created_at: Date;
          updated_at: Date;
        };
        return created;
      });

      return reply.status(201).send({
        id: row.id,
        displayName: row.display_name,
        type: row.type,
        linkedUserId: row.linked_user_id ?? undefined,
        status: row.status,
        contactName: row.contact_name ?? undefined,
        contactEmail: row.contact_email ?? undefined,
        contactPhone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        wholesalerId: row.legacy_wholesaler_id ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
  );

  fastify.patch<{ Params: { id: string }; Body: z.infer<typeof patchAccountSchema> }>(
    '/accounts/:id',
    {
      preHandler: adminPre,
      schema: {
        description: 'Update account basic fields',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        throw new ValidationError('Invalid account id', idParsed.error.errors);
      }
      const bodyParsed = patchAccountSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const accountId = idParsed.data;
      const { displayName, status, contactName, contactEmail, contactPhone, notes } =
        bodyParsed.data;

      const row = await withTx(async (client) => {
        const currentResult = await client.query(
          `SELECT id, type::text AS type, legacy_wholesaler_id
           FROM accounts
           WHERE id = $1 AND deleted_at IS NULL`,
          [accountId]
        );
        if (currentResult.rows.length === 0) {
          throw new NotFoundError('Account', accountId);
        }
        const current = currentResult.rows[0] as {
          type: 'OWNER' | 'WHOLESALER';
          legacy_wholesaler_id: string | null;
        };

        const result = await client.query(
          `UPDATE accounts
           SET display_name = COALESCE($1, display_name),
               status = COALESCE($2::account_status, status),
               contact_name = COALESCE($3, contact_name),
               contact_email = COALESCE($4, contact_email),
               contact_phone = COALESCE($5, contact_phone),
               notes = COALESCE($6, notes),
               updated_at = NOW()
           WHERE id = $7 AND deleted_at IS NULL
           RETURNING id, display_name, type::text AS type, linked_user_id, status::text AS status, contact_name, contact_email, contact_phone, notes, legacy_wholesaler_id, created_at, updated_at`,
          [
            displayName ?? null,
            status ?? null,
            contactName?.trim() || null,
            contactEmail?.trim() || null,
            contactPhone?.trim() || null,
            notes?.trim() || null,
            accountId,
          ]
        );
        const updated = result.rows[0] as {
          id: string;
          display_name: string;
          type: 'OWNER' | 'WHOLESALER';
          linked_user_id: string | null;
          status: 'ACTIVE' | 'ARCHIVED';
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          legacy_wholesaler_id: string | null;
          created_at: Date;
          updated_at: Date;
        };

        if (current.type === 'WHOLESALER' && current.legacy_wholesaler_id != null) {
          await client.query(
            `UPDATE wholesalers
             SET name = $1,
                 contact_email = $2,
                 contact_phone = $3,
                 notes = $4,
                 updated_at = NOW()
             WHERE id = $5`,
            [
              updated.display_name,
              updated.contact_email ?? null,
              updated.contact_phone ?? null,
              updated.notes ?? null,
              current.legacy_wholesaler_id,
            ]
          );
        }

        return updated;
      });

      return reply.send({
        id: row.id,
        displayName: row.display_name,
        type: row.type,
        linkedUserId: row.linked_user_id ?? undefined,
        status: row.status,
        contactName: row.contact_name ?? undefined,
        contactEmail: row.contact_email ?? undefined,
        contactPhone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        wholesalerId: row.legacy_wholesaler_id ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }
  );

  fastify.post<{ Params: { id: string }; Body: z.infer<typeof linkUserSchema> }>(
    '/accounts/:id/link-user',
    {
      preHandler: adminPre,
      schema: {
        description: 'Link a user to an account',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        throw new ValidationError('Invalid account id', idParsed.error.errors);
      }
      const bodyParsed = linkUserSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const accountId = idParsed.data;
      const userRef = bodyParsed.data.userId.trim();

      const pool = getPool();
      const accountResult = await pool.query(
        `SELECT id, type::text AS type, legacy_wholesaler_id
         FROM accounts
         WHERE id = $1 AND deleted_at IS NULL`,
        [accountId]
      );
      if (accountResult.rows.length === 0) {
        throw new NotFoundError('Account', accountId);
      }
      const account = accountResult.rows[0] as {
        id: string;
        type: 'OWNER' | 'WHOLESALER';
        legacy_wholesaler_id: string | null;
      };

      const userIdAsUuid = uuidSchema.safeParse(userRef);
      const userResult = userIdAsUuid.success
        ? await pool.query(
            `SELECT id, wholesaler_id
             FROM users
             WHERE (id = $1 OR cognito_user_id = $2) AND deleted_at IS NULL
             LIMIT 1`,
            [userRef, userRef]
          )
        : await pool.query(
            `SELECT id, wholesaler_id
             FROM users
             WHERE cognito_user_id = $1 AND deleted_at IS NULL
             LIMIT 1`,
            [userRef]
          );
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User', userRef);
      }
      const user = userResult.rows[0] as { id: string; wholesaler_id: string | null };

      const taken = await pool.query(
        `SELECT id FROM accounts WHERE linked_user_id = $1 AND id <> $2 AND deleted_at IS NULL LIMIT 1`,
        [user.id, account.id]
      );
      if (taken.rows.length > 0) {
        throw new ConflictError('User is already linked to another account');
      }

      await withTx(async (client) => {
        await client.query(
          `UPDATE accounts
           SET linked_user_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [user.id, account.id]
        );

        if (account.type === 'WHOLESALER' && account.legacy_wholesaler_id) {
          await client.query(
            `UPDATE users
             SET wholesaler_id = $1, updated_at = NOW()
             WHERE id = $2`,
            [account.legacy_wholesaler_id, user.id]
          );
        }
      });

      return reply.send({
        ok: true,
        accountId: account.id,
        userId: user.id,
      });
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/accounts/:id/unlink-user',
    {
      preHandler: adminPre,
      schema: {
        description: 'Unlink user from account',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        throw new ValidationError('Invalid account id', idParsed.error.errors);
      }
      const accountId = idParsed.data;
      const pool = getPool();
      const accountResult = await pool.query(
        `SELECT id, linked_user_id, type::text AS type
         FROM accounts
         WHERE id = $1 AND deleted_at IS NULL`,
        [accountId]
      );
      if (accountResult.rows.length === 0) {
        throw new NotFoundError('Account', accountId);
      }
      const account = accountResult.rows[0] as {
        id: string;
        linked_user_id: string | null;
        type: 'OWNER' | 'WHOLESALER';
      };

      if (account.linked_user_id == null) {
        return reply.send({ ok: true, accountId: account.id });
      }

      await withTx(async (client) => {
        const accountMeta = await client.query(
          `SELECT legacy_wholesaler_id, linked_user_id
           FROM accounts
           WHERE id = $1`,
          [account.id]
        );
        const meta = accountMeta.rows[0] as {
          legacy_wholesaler_id: string | null;
          linked_user_id: string | null;
        };
        await client.query(
          `UPDATE accounts
           SET linked_user_id = NULL, updated_at = NOW()
           WHERE id = $1`,
          [account.id]
        );
        if (meta.legacy_wholesaler_id && meta.linked_user_id) {
          await client.query(
            `UPDATE users
             SET wholesaler_id = NULL, updated_at = NOW()
             WHERE id = $1 AND wholesaler_id = $2`,
            [meta.linked_user_id, meta.legacy_wholesaler_id]
          );
        }
      });

      return reply.send({ ok: true, accountId: account.id });
    }
  );
}
