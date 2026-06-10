import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { resolveOwnerAccountId } from '../db/owner-account';
import {
  computeOwnerPayoutWithStrategy,
  toOwnerPayoutComputationDto,
} from '../services/owner-payout-computation';
import { ownerPayoutAmountToRecord } from '../services/owner-payout-strategy';
import { loadOwnerPayoutSourceContextMap } from '../services/owner-weekly-payout';
import { loadOwnerTotalPaidAmount } from '../services/financial-event-summaries';
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

type OwnerActivityTransactionDto = OwnerSelfPayDto & {
  sourceContext: {
    closedShowsCount: number;
    openShowsExcludedCount: number;
    closedProfitTotal: string;
    shows: OwnerPayoutSourceShowDto[];
  };
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
          'Owner payout activity: summary plus transactions (includes voided rows for audit). Summary totalPaidAmount and closedProfitTotal use event-backed show profit.',
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

      const [summaryResult, totalPaidAmount] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE voided_at IS NULL)::int AS active_payout_count,
             COUNT(*) FILTER (WHERE voided_at IS NOT NULL)::int AS voided_payout_count,
             MAX(paid_at) FILTER (WHERE voided_at IS NULL) AS last_paid_at
           FROM owner_self_pay_transactions
           WHERE account_id = $1
             AND deleted_at IS NULL`,
          [ownerAccountId]
        ),
        loadOwnerTotalPaidAmount(pool),
      ]);

      const s = summaryResult.rows[0] as {
        active_payout_count: number;
        voided_payout_count: number;
        last_paid_at: Date | null;
      };

      const txResult = await pool.query(
        `SELECT id, account_id, account_type::text AS account_type, amount,
                week_start_date, week_end_date, paid_at, transaction_type::text AS transaction_type,
                reference, note, voided_at, created_at, updated_at
         FROM owner_self_pay_transactions
         WHERE account_id = $1
           AND deleted_at IS NULL
         ORDER BY (voided_at IS NULL) DESC, paid_at DESC NULLS LAST, created_at DESC
         LIMIT $2`,
        [ownerAccountId, limit]
      );

      const txRows = txResult.rows as OwnerSelfPayRow[];

      const sourceContextMap = await loadOwnerPayoutSourceContextMap(
        pool,
        txRows.map((row) => ({
          weekStartDate: toYyyyMmDd(row.week_start_date),
          weekEndDate: toYyyyMmDd(row.week_end_date),
        }))
      );

      const transactions: OwnerActivityTransactionDto[] = txRows.map((row) => {
        const weekStart = toYyyyMmDd(row.week_start_date);
        const weekEnd = toYyyyMmDd(row.week_end_date);
        const sourceContext = sourceContextMap.get(`${weekStart}|${weekEnd}`) ?? {
          closedShowsCount: 0,
          openShowsExcludedCount: 0,
          closedProfitTotal: '0',
          shows: [],
        };

        return {
          ...toOwnerSelfPayDto(row),
          sourceContext: {
            closedShowsCount: sourceContext.closedShowsCount,
            openShowsExcludedCount: sourceContext.openShowsExcludedCount,
            closedProfitTotal: sourceContext.closedProfitTotal,
            shows: sourceContext.shows,
          },
        };
      });

      return reply.send({
        summary: {
          totalPaidAmount,
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
      const ownerAccountId = await resolveOwnerAccountId();
      const computed = await computeOwnerPayoutWithStrategy(
        pool,
        weekStart,
        weekEnd,
        ownerAccountId
      );
      return reply.send(toOwnerPayoutComputationDto(computed));
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
      const ownerAccountId = await resolveOwnerAccountId();
      const computedPayout = await computeOwnerPayoutWithStrategy(
        pool,
        weekStart,
        week_end_date,
        ownerAccountId
      );
      if (computedPayout.remainingAvailablePayout <= 0) {
        throw new ValidationError(
          `No remaining owner payout available for ${weekStart} to ${week_end_date}`
        );
      }
      if (
        amount !== undefined &&
        Math.abs(amount - computedPayout.remainingAvailablePayout) > 0.01
      ) {
        throw new ValidationError(
          `amount ${amount.toFixed(2)} does not match remaining available payout ${computedPayout.remainingAvailablePayout.toFixed(
            2
          )}`
        );
      }

      const storedPayoutAmount = ownerPayoutAmountToRecord(
        computedPayout.ownerPaidThisPeriod,
        computedPayout.remainingAvailablePayout
      );
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
            storedPayoutAmount,
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
