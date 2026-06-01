import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import {
  emitSettlementAdjusted,
  emitSettlementCreated,
  emitSettlementVoided,
  resolveActorUserId,
  vendorExpenseEffectiveDate,
  vendorExpenseMateriallyChanged,
} from '../services/financial-event-emission';
import { NotFoundError, ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const positiveAmountSchema = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n) || n <= 0) {
    throw new Error('amount must be greater than 0');
  }
  return n;
});

const postVendorExpenseSchema = z.object({
  amount: positiveAmountSchema,
  description: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'description must not be empty')),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const patchVendorExpenseSchema = z
  .object({
    amount: positiveAmountSchema.optional(),
    description: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1))
      .optional(),
    expense_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((d) => d.amount != null || d.description != null || d.expense_date !== undefined, {
    message: 'Provide at least one of amount, description, expense_date',
  });

/**
 * Manual vendor expenses: owed_line_items with obligation_kind = VENDOR_EXPENSE (no show).
 * Attachments reuse settlement_attachments / owed_line_item id (see attachment routes).
 */
export async function vendorExpenseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{
    Params: { wholesalerId: string };
    Body: z.infer<typeof postVendorExpenseSchema>;
  }>(
    '/wholesalers/:wholesalerId/vendor-expenses',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a manual vendor expense obligation (not tied to a show)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['wholesalerId'],
          properties: { wholesalerId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['amount', 'description'],
          properties: {
            amount: { type: 'number' },
            description: { type: 'string' },
            expense_date: { type: 'string', format: 'date' },
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
              description: { type: 'string' },
              expense_date: { type: 'string' },
              obligation_kind: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const widParsed = uuidSchema.safeParse(request.params.wholesalerId);
      if (!widParsed.success) {
        throw new ValidationError('Invalid wholesaler id', widParsed.error.errors);
      }
      const wholesalerId = widParsed.data;

      const bodyParsed = postVendorExpenseSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const { amount, description, expense_date } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);

        const wh = await client.query(
          `SELECT id FROM wholesalers WHERE id = $1 AND deleted_at IS NULL`,
          [wholesalerId]
        );
        if (wh.rows.length === 0) {
          throw new NotFoundError('Wholesaler', wholesalerId);
        }
        const accountResult = await client.query(
          `SELECT id
           FROM accounts
           WHERE type = 'WHOLESALER'
             AND legacy_wholesaler_id = $1
             AND deleted_at IS NULL
           LIMIT 1`,
          [wholesalerId]
        );
        if (accountResult.rows.length === 0) {
          throw new NotFoundError('Account', `mapped from wholesaler ${wholesalerId}`);
        }
        const accountId = (accountResult.rows[0] as { id: string }).id;

        const due = expense_date ?? null;

        const result = await client.query(
          `INSERT INTO owed_line_items (
             show_id, wholesaler_id, account_id, amount, currency, description, due_date, status,
             created_by, created_via, obligation_kind, calculation_method
           )
           VALUES (NULL, $1, $2, $3, 'USD', $4, $5, 'PENDING', $6, 'API', 'VENDOR_EXPENSE', NULL)
           RETURNING id, show_id, wholesaler_id, account_id, amount, currency, description, due_date,
                     obligation_kind, created_at, updated_at`,
          [wholesalerId, accountId, amount, description, due, userId]
        );
        const inserted = result.rows[0] as {
          id: string;
          show_id: string | null;
          wholesaler_id: string;
          account_id: string;
          amount: string;
          currency: string;
          description: string;
          due_date: Date | null;
          obligation_kind: string;
          created_at: Date;
          updated_at: Date;
        };
        const effectiveDate = vendorExpenseEffectiveDate(inserted.due_date, inserted.created_at);
        await emitSettlementCreated(
          client,
          {
            id: inserted.id,
            show_id: inserted.show_id,
            wholesaler_id: inserted.wholesaler_id,
            account_id: inserted.account_id,
            amount: inserted.amount,
            description: inserted.description,
            obligation_kind: inserted.obligation_kind,
            due_date: inserted.due_date,
          },
          effectiveDate,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });

      return reply.status(201).send({
        id: row.id,
        wholesaler_id: row.wholesaler_id,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        expense_date: row.due_date ? row.due_date.toISOString().slice(0, 10) : undefined,
        obligation_kind: row.obligation_kind,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );

  fastify.patch<{
    Params: { wholesalerId: string; expenseId: string };
    Body: z.infer<typeof patchVendorExpenseSchema>;
  }>(
    '/wholesalers/:wholesalerId/vendor-expenses/:expenseId',
    {
      preHandler: adminPre,
      schema: {
        description: 'Update a manual vendor expense obligation',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['wholesalerId', 'expenseId'],
          properties: {
            wholesalerId: { type: 'string', format: 'uuid' },
            expenseId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            description: { type: 'string' },
            expense_date: { type: ['string', 'null'], format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              wholesaler_id: { type: 'string' },
              amount: { type: 'string' },
              currency: { type: 'string' },
              description: { type: 'string' },
              expense_date: { type: 'string' },
              obligation_kind: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const widParsed = uuidSchema.safeParse(request.params.wholesalerId);
      const eidParsed = uuidSchema.safeParse(request.params.expenseId);
      if (!widParsed.success || !eidParsed.success) {
        const errs = [
          ...(widParsed.success ? [] : widParsed.error.errors),
          ...(eidParsed.success ? [] : eidParsed.error.errors),
        ];
        throw new ValidationError('Invalid id', errs);
      }
      const wholesalerId = widParsed.data;
      const expenseId = eidParsed.data;

      const bodyParsed = patchVendorExpenseSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const { amount, description, expense_date } = bodyParsed.data;

      const row = await withTx(async (client) => {
        await ensureUser(client, request);

        const cur = await client.query(
          `SELECT id, show_id, wholesaler_id, account_id, amount, description, due_date, obligation_kind, created_at
             FROM owed_line_items
            WHERE id = $1 AND wholesaler_id = $2 AND obligation_kind = 'VENDOR_EXPENSE' AND deleted_at IS NULL`,
          [expenseId, wholesalerId]
        );
        if (cur.rows.length === 0) {
          throw new NotFoundError('Vendor expense', expenseId);
        }

        const prior = cur.rows[0] as {
          id: string;
          show_id: string | null;
          wholesaler_id: string;
          account_id: string;
          amount: string;
          description: string;
          due_date: Date | null;
          obligation_kind: string;
          created_at: Date;
        };

        const nextAmount = amount ?? parseFloat(prior.amount);
        const nextDesc = description ?? prior.description;
        let nextDue: Date | null = prior.due_date;
        if (expense_date !== undefined) {
          nextDue = expense_date === null ? null : new Date(expense_date + 'T12:00:00.000Z');
        }

        const upd = await client.query(
          `UPDATE owed_line_items
              SET amount = $1,
                  description = $2,
                  due_date = $3,
                  updated_at = NOW()
            WHERE id = $4 AND wholesaler_id = $5 AND obligation_kind = 'VENDOR_EXPENSE' AND deleted_at IS NULL
          RETURNING id, show_id, wholesaler_id, account_id, amount, currency, description, due_date,
                    obligation_kind, created_at, updated_at`,
          [nextAmount, nextDesc, nextDue, expenseId, wholesalerId]
        );
        const updated = upd.rows[0] as {
          id: string;
          show_id: string | null;
          wholesaler_id: string;
          account_id: string;
          amount: string;
          currency: string;
          description: string;
          due_date: Date | null;
          obligation_kind: string;
          created_at: Date;
          updated_at: Date;
        };

        if (
          vendorExpenseMateriallyChanged(
            {
              amount: prior.amount,
              description: prior.description,
              due_date: prior.due_date,
            },
            {
              amount: updated.amount,
              description: updated.description,
              due_date: updated.due_date,
            }
          )
        ) {
          const effectiveDate = vendorExpenseEffectiveDate(updated.due_date, updated.updated_at);
          await emitSettlementAdjusted(
            client,
            {
              id: updated.id,
              show_id: updated.show_id,
              wholesaler_id: updated.wholesaler_id,
              account_id: updated.account_id,
              amount: updated.amount,
              description: updated.description,
              obligation_kind: updated.obligation_kind,
              due_date: updated.due_date,
            },
            effectiveDate,
            {
              amount: prior.amount,
              description: prior.description,
              due_date: prior.due_date,
            },
            resolveActorUserId(request.user?.cognitoSub),
            updated.updated_at
          );
        }

        return updated;
      });

      return reply.send({
        id: row.id,
        wholesaler_id: row.wholesaler_id,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        expense_date: row.due_date ? row.due_date.toISOString().slice(0, 10) : undefined,
        obligation_kind: row.obligation_kind,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );

  fastify.delete<{
    Params: { wholesalerId: string; expenseId: string };
  }>(
    '/wholesalers/:wholesalerId/vendor-expenses/:expenseId',
    {
      preHandler: adminPre,
      schema: {
        description: 'Soft-delete a manual vendor expense obligation',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['wholesalerId', 'expenseId'],
          properties: {
            wholesalerId: { type: 'string', format: 'uuid' },
            expenseId: { type: 'string', format: 'uuid' },
          },
        },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const widParsed = uuidSchema.safeParse(request.params.wholesalerId);
      const eidParsed = uuidSchema.safeParse(request.params.expenseId);
      if (!widParsed.success || !eidParsed.success) {
        const errs = [
          ...(widParsed.success ? [] : widParsed.error.errors),
          ...(eidParsed.success ? [] : eidParsed.error.errors),
        ];
        throw new ValidationError('Invalid id', errs);
      }
      const wholesalerId = widParsed.data;
      const expenseId = eidParsed.data;

      await withTx(async (client) => {
        const cur = await client.query(
          `SELECT id, show_id, wholesaler_id, account_id, amount, description, due_date, obligation_kind, created_at
             FROM owed_line_items
            WHERE id = $1 AND wholesaler_id = $2 AND obligation_kind = 'VENDOR_EXPENSE' AND deleted_at IS NULL`,
          [expenseId, wholesalerId]
        );
        if (cur.rows.length === 0) {
          throw new NotFoundError('Vendor expense', expenseId);
        }

        const prior = cur.rows[0] as {
          id: string;
          show_id: string | null;
          wholesaler_id: string;
          account_id: string;
          amount: string;
          description: string;
          due_date: Date | null;
          obligation_kind: string;
          created_at: Date;
        };

        const voidedAt = new Date();
        await client.query(
          `UPDATE owed_line_items
              SET deleted_at = $3, updated_at = NOW()
            WHERE id = $1 AND wholesaler_id = $2 AND obligation_kind = 'VENDOR_EXPENSE' AND deleted_at IS NULL`,
          [expenseId, wholesalerId, voidedAt]
        );

        const effectiveDate = vendorExpenseEffectiveDate(prior.due_date, prior.created_at);
        await emitSettlementVoided(
          client,
          {
            id: prior.id,
            show_id: prior.show_id,
            wholesaler_id: prior.wholesaler_id,
            account_id: prior.account_id,
            amount: prior.amount,
            description: prior.description,
            obligation_kind: prior.obligation_kind,
            due_date: prior.due_date,
          },
          effectiveDate,
          resolveActorUserId(request.user?.cognitoSub),
          voidedAt
        );
      });

      return reply.status(204).send();
    }
  );
}
