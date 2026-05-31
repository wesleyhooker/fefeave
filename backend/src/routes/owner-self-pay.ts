import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { resolveOwnerAccountId } from '../db/owner-account';
import { computeOwnerWeeklyPayout } from '../services/owner-weekly-payout';
import {
  emitOwnerSelfPayCorrected,
  emitOwnerSelfPayRecorded,
  emitOwnerSelfPayVoided,
  ownerSelfPayMateriallyChanged,
  resolveActorUserId,
} from '../services/financial-event-emission';
import { ValidationError } from '../utils/errors';
import { toYyyyMmDd } from '../utils/pg-date';

const weekDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const ownerTxTypeSchema = z.enum(['OWNER_DRAW', 'SELF_PAY']);
const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const upsertOwnerSelfPaySchema = z.object({
  week_end_date: weekDateSchema,
  amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return undefined;
      const n = typeof v === 'string' ? Number.parseFloat(v) : v;
      if (Number.isNaN(n) || n < 0) {
        throw new Error('amount must be greater than or equal to 0');
      }
      return Number(n.toFixed(2));
    }),
  paid_at: z.string().datetime().optional(),
  transaction_type: ownerTxTypeSchema.optional(),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

function addDays(yyyyMmDd: string, days: number): string {
  const year = Number(yyyyMmDd.slice(0, 4));
  const month = Number(yyyyMmDd.slice(5, 7));
  const day = Number(yyyyMmDd.slice(8, 10));
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

type OwnerSelfPayRow = {
  id: string;
  account_id: string;
  account_type: 'OWNER';
  amount: string;
  week_start_date: string;
  week_end_date: string;
  paid_at: Date;
  transaction_type: 'OWNER_DRAW' | 'SELF_PAY';
  reference: string | null;
  note: string | null;
  voided_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type OwnerSelfPayDto = {
  id: string;
  accountId: string;
  accountType: 'OWNER';
  amount: string;
  weekStartDate: string;
  weekEndDate: string;
  paidAt: Date;
  transactionType: 'OWNER_DRAW' | 'SELF_PAY';
  reference?: string;
  note?: string;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type OwnerPayoutSourceShowDto = {
  showId: string;
  name: string;
  showDate: string;
  status: string;
  profitAmount: string;
  includedInPayout: boolean;
};

type OwnerPayoutSourceContextDto = {
  closedShowsCount: number;
  openShowsExcludedCount: number;
  closedProfitTotal: string;
  shows: OwnerPayoutSourceShowDto[];
};

type OwnerActivityTransactionDto = OwnerSelfPayDto & {
  sourceContext: OwnerPayoutSourceContextDto;
};

function toOwnerSelfPayDto(row: OwnerSelfPayRow): OwnerSelfPayDto {
  return {
    id: row.id,
    accountId: row.account_id,
    accountType: row.account_type,
    amount: row.amount,
    weekStartDate: toYyyyMmDd(row.week_start_date),
    weekEndDate: toYyyyMmDd(row.week_end_date),
    paidAt: row.paid_at,
    transactionType: row.transaction_type,
    reference: row.reference ?? undefined,
    note: row.note ?? undefined,
    voidedAt: row.voided_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ownerSelfPayRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get<{ Querystring: z.infer<typeof historyQuerySchema> }>(
    '/owner-self-pay/history',
    {
      preHandler: adminPre,
      schema: {
        description: 'List owner self-pay transaction history',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = historyQuerySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        throw new ValidationError('Invalid query', parsed.error.errors);
      }
      const limit = parsed.data.limit ?? 10;
      const ownerAccountId = await resolveOwnerAccountId();
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, account_id, account_type::text AS account_type, amount,
                week_start_date, week_end_date, paid_at, transaction_type::text AS transaction_type,
                reference, note, voided_at, created_at, updated_at
         FROM owner_self_pay_transactions
         WHERE account_id = $1
           AND deleted_at IS NULL
           AND voided_at IS NULL
         ORDER BY paid_at DESC, created_at DESC
         LIMIT $2`,
        [ownerAccountId, limit]
      );
      const rows = result.rows as OwnerSelfPayRow[];
      return reply.send(rows.map(toOwnerSelfPayDto));
    }
  );

  fastify.get<{ Querystring: z.infer<typeof activityQuerySchema> }>(
    '/owner-self-pay/activity',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Owner payout activity: summary plus transactions (includes voided rows for audit)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = activityQuerySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        throw new ValidationError('Invalid query', parsed.error.errors);
      }
      const limit = parsed.data.limit ?? 150;
      const ownerAccountId = await resolveOwnerAccountId();
      const pool = getPool();

      const summaryResult = await pool.query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE voided_at IS NULL), 0)::text AS total_paid_amount,
           COUNT(*) FILTER (WHERE voided_at IS NULL)::int AS active_payout_count,
           COUNT(*) FILTER (WHERE voided_at IS NOT NULL)::int AS voided_payout_count,
           MAX(paid_at) FILTER (WHERE voided_at IS NULL) AS last_paid_at
         FROM owner_self_pay_transactions
         WHERE account_id = $1
           AND deleted_at IS NULL`,
        [ownerAccountId]
      );

      const s = summaryResult.rows[0] as {
        total_paid_amount: string;
        active_payout_count: number;
        voided_payout_count: number;
        last_paid_at: Date | null;
      };

      const txResult = await pool.query(
        `WITH tx AS (
           SELECT id, account_id, account_type::text AS account_type, amount,
                  week_start_date, week_end_date, paid_at, transaction_type::text AS transaction_type,
                  reference, note, voided_at, created_at, updated_at
           FROM owner_self_pay_transactions
           WHERE account_id = $1
             AND deleted_at IS NULL
           ORDER BY (voided_at IS NULL) DESC, paid_at DESC NULLS LAST, created_at DESC
           LIMIT $2
         ),
         weekly_shows AS (
           SELECT
             tx.id AS tx_id,
             s.id AS show_id,
             s.name AS show_name,
             s.show_date::date::text AS show_date,
             s.status::text AS show_status,
             (
               COALESCE(sf.payout_after_fees_amount, 0::numeric) - COALESCE(owed.owed_total, 0::numeric)
             )::text AS profit_amount
           FROM tx
           LEFT JOIN shows s
             ON s.deleted_at IS NULL
            AND s.show_date >= tx.week_start_date
            AND s.show_date <= tx.week_end_date
           LEFT JOIN show_financials sf ON sf.show_id = s.id
           LEFT JOIN LATERAL (
             SELECT COALESCE(SUM(oli.amount), 0::numeric) AS owed_total
             FROM owed_line_items oli
             WHERE oli.deleted_at IS NULL
               AND oli.show_id = s.id
               AND oli.obligation_kind = 'SHOW_LINKED'
           ) owed ON TRUE
         )
         SELECT
           tx.id, tx.account_id, tx.account_type, tx.amount,
           tx.week_start_date, tx.week_end_date, tx.paid_at, tx.transaction_type,
           tx.reference, tx.note, tx.voided_at, tx.created_at, tx.updated_at,
           COALESCE(COUNT(*) FILTER (WHERE ws.show_status = 'COMPLETED'), 0)::int AS closed_shows_count,
           COALESCE(COUNT(*) FILTER (WHERE ws.show_id IS NOT NULL AND ws.show_status <> 'COMPLETED'), 0)::int AS open_shows_excluded_count,
           COALESCE(SUM((ws.profit_amount)::numeric) FILTER (WHERE ws.show_status = 'COMPLETED'), 0::numeric)::text AS closed_profit_total,
           COALESCE(
             json_agg(
               json_build_object(
                 'showId', ws.show_id,
                 'name', ws.show_name,
                 'showDate', ws.show_date,
                 'status', ws.show_status,
                 'profitAmount', ws.profit_amount,
                 'includedInPayout', (ws.show_status = 'COMPLETED')
               )
               ORDER BY ws.show_date ASC, ws.show_name ASC
             ) FILTER (WHERE ws.show_id IS NOT NULL),
             '[]'::json
           ) AS source_shows
         FROM tx
         LEFT JOIN weekly_shows ws ON ws.tx_id = tx.id
         GROUP BY
           tx.id, tx.account_id, tx.account_type, tx.amount,
           tx.week_start_date, tx.week_end_date, tx.paid_at, tx.transaction_type,
           tx.reference, tx.note, tx.voided_at, tx.created_at, tx.updated_at
         ORDER BY (tx.voided_at IS NULL) DESC, tx.paid_at DESC NULLS LAST, tx.created_at DESC`,
        [ownerAccountId, limit]
      );

      const txRows = txResult.rows as Array<
        OwnerSelfPayRow & {
          closed_shows_count: number;
          open_shows_excluded_count: number;
          closed_profit_total: string;
          source_shows: OwnerPayoutSourceShowDto[];
        }
      >;

      const transactions: OwnerActivityTransactionDto[] = txRows.map((row) => ({
        ...toOwnerSelfPayDto(row),
        sourceContext: {
          closedShowsCount: Number(row.closed_shows_count) || 0,
          openShowsExcludedCount: Number(row.open_shows_excluded_count) || 0,
          closedProfitTotal: row.closed_profit_total,
          shows: Array.isArray(row.source_shows) ? row.source_shows : [],
        },
      }));

      return reply.send({
        summary: {
          totalPaidAmount: s.total_paid_amount,
          activePayoutCount: Number(s.active_payout_count),
          voidedPayoutCount: Number(s.voided_payout_count),
          lastPaidAt: s.last_paid_at != null ? new Date(s.last_paid_at).toISOString() : null,
        },
        transactions,
      });
    }
  );

  fastify.get<{ Params: { weekStart: string } }>(
    '/owner-self-pay/:weekStart/payout',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get computed owner payout amount for a week',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const weekStart = weekStartParsed.data;
      const weekEnd = addDays(weekStart, 6);

      const pool = getPool();
      const payout = await computeOwnerWeeklyPayout(pool, weekStart, weekEnd);
      return reply.send({
        weekStartDate: payout.weekStartDate,
        weekEndDate: payout.weekEndDate,
        completedShowCount: payout.completedShowCount,
        amount: payout.amount.toFixed(2),
      });
    }
  );

  fastify.get<{ Params: { weekStart: string } }>(
    '/owner-self-pay/:weekStart',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get owner self-pay transaction for a week',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const weekStart = weekStartParsed.data;
      const ownerAccountId = await resolveOwnerAccountId();

      const pool = getPool();
      const result = await pool.query(
        `SELECT id, account_id, account_type::text AS account_type, amount,
                week_start_date, week_end_date, paid_at, transaction_type::text AS transaction_type,
                reference, note, voided_at, created_at, updated_at
         FROM owner_self_pay_transactions
         WHERE account_id = $1
           AND week_start_date = $2
           AND voided_at IS NULL
           AND deleted_at IS NULL
         LIMIT 1`,
        [ownerAccountId, weekStart]
      );

      const row = result.rows[0] as OwnerSelfPayRow | undefined;
      return reply.send({
        weekStartDate: weekStart,
        weekEndDate: addDays(weekStart, 6),
        transaction: row ? toOwnerSelfPayDto(row) : null,
      });
    }
  );

  fastify.put<{ Params: { weekStart: string }; Body: z.infer<typeof upsertOwnerSelfPaySchema> }>(
    '/owner-self-pay/:weekStart',
    {
      preHandler: adminPre,
      schema: {
        description: 'Mark week as paid for owner self-pay',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const bodyParsed = upsertOwnerSelfPaySchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }

      const weekStart = weekStartParsed.data;
      const weekEndExpected = addDays(weekStart, 6);
      const {
        amount,
        week_end_date,
        paid_at,
        transaction_type = 'SELF_PAY',
        reference: referenceRaw,
        note: noteRaw,
      } = bodyParsed.data;

      const referenceTrim = referenceRaw?.trim();
      const noteTrim = noteRaw?.trim();
      const reference = referenceTrim && referenceTrim.length > 0 ? referenceTrim : 'Week payout';
      const note = noteTrim && noteTrim.length > 0 ? noteTrim : 'Week payout';

      if (week_end_date !== weekEndExpected) {
        throw new ValidationError(`week_end_date must be ${weekEndExpected} for week ${weekStart}`);
      }

      const pool = getPool();
      const computedPayout = await computeOwnerWeeklyPayout(pool, weekStart, week_end_date);
      if (computedPayout.amount <= 0) {
        throw new ValidationError(
          `No owner payout available for ${weekStart} to ${week_end_date}; payout must be greater than 0`
        );
      }
      if (amount !== undefined && Math.abs(amount - computedPayout.amount) > 0.01) {
        throw new ValidationError(
          `amount ${amount.toFixed(2)} does not match computed weekly payout ${computedPayout.amount.toFixed(
            2
          )}`
        );
      }

      const ownerAccountId = await resolveOwnerAccountId();
      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);
        const existingResult = await client.query(
          `SELECT id, amount, paid_at, transaction_type::text AS transaction_type,
                  week_start_date, week_end_date, reference, note, voided_at, updated_at
           FROM owner_self_pay_transactions
           WHERE account_id = $1 AND week_start_date = $2 AND deleted_at IS NULL`,
          [ownerAccountId, weekStart]
        );
        const prior = existingResult.rows[0] as OwnerSelfPayRow | undefined;

        // One row per (account_id, week_start_date): revive voided weeks in place (clears voided_at).
        const result = await client.query(
          `INSERT INTO owner_self_pay_transactions (
             account_id,
             account_type,
             amount,
             week_start_date,
             week_end_date,
             paid_at,
             transaction_type,
             reference,
             note,
             created_by,
             voided_at,
             deleted_at
           )
           VALUES ($1, 'OWNER', $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6, $7, $8, $9, NULL, NULL)
           ON CONFLICT (account_id, week_start_date)
           DO UPDATE
              SET account_type = 'OWNER',
                  amount = EXCLUDED.amount,
                  week_end_date = EXCLUDED.week_end_date,
                  paid_at = EXCLUDED.paid_at,
                  transaction_type = EXCLUDED.transaction_type,
                  reference = EXCLUDED.reference,
                  note = EXCLUDED.note,
                  created_by = EXCLUDED.created_by,
                  voided_at = NULL,
                  deleted_at = NULL,
                  updated_at = NOW()
           RETURNING id, account_id, account_type::text AS account_type, amount,
                     week_start_date, week_end_date, paid_at, transaction_type::text AS transaction_type,
                     reference, note, voided_at, created_at, updated_at`,
          [
            ownerAccountId,
            computedPayout.amount,
            weekStart,
            week_end_date,
            paid_at ?? null,
            transaction_type,
            reference,
            note,
            userId,
          ]
        );
        const inserted = result.rows[0] as OwnerSelfPayRow;
        const actorUserId = resolveActorUserId(request.user?.cognitoSub);
        if (!prior || prior.voided_at) {
          await emitOwnerSelfPayRecorded(
            client,
            inserted,
            actorUserId,
            prior?.voided_at ? inserted.updated_at.toISOString() : undefined
          );
        } else if (ownerSelfPayMateriallyChanged(prior, inserted)) {
          await emitOwnerSelfPayCorrected(client, inserted, prior, actorUserId);
        }
        return inserted;
      });

      return reply.send({
        weekStartDate: weekStart,
        weekEndDate: week_end_date,
        transaction: toOwnerSelfPayDto(row),
      });
    }
  );

  fastify.delete<{ Params: { weekStart: string } }>(
    '/owner-self-pay/:weekStart',
    {
      preHandler: adminPre,
      schema: {
        description: 'Mark owner self-pay as unpaid for a week (void)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const weekStart = weekStartParsed.data;
      const ownerAccountId = await resolveOwnerAccountId();

      // Idempotent: only rows that are still active (voided_at IS NULL) are updated.
      // Re-void / duplicate DELETE calls affect 0 rows — no second transaction row is ever created.
      await withTx(async (client) => {
        const existingResult = await client.query(
          `SELECT id, amount, paid_at, transaction_type::text AS transaction_type,
                  week_start_date, week_end_date, reference, note
           FROM owner_self_pay_transactions
           WHERE account_id = $1
             AND week_start_date = $2
             AND voided_at IS NULL
             AND deleted_at IS NULL`,
          [ownerAccountId, weekStart]
        );
        if (existingResult.rows.length === 0) return;

        const prior = existingResult.rows[0] as OwnerSelfPayRow;
        const voidedAt = new Date();
        await client.query(
          `UPDATE owner_self_pay_transactions
           SET voided_at = $3,
               updated_at = NOW()
           WHERE account_id = $1
             AND week_start_date = $2
             AND voided_at IS NULL
             AND deleted_at IS NULL`,
          [ownerAccountId, weekStart, voidedAt]
        );
        await emitOwnerSelfPayVoided(
          client,
          prior,
          resolveActorUserId(request.user?.cognitoSub),
          voidedAt
        );
      });

      return reply.status(204).send();
    }
  );
}
