import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { isStrategyAllocationType } from '../constants/strategy-allocation';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import {
  emitStrategyAllocationRecorded,
  emitStrategyAllocationVoided,
  resolveActorUserId,
} from '../services/financial-event-emission';
import {
  addDaysYmd,
  buildPeriodAllocationsDto,
  getStrategyAllocationEntryById,
  insertStrategyAllocationEntry,
  toStrategyAllocationEntryDto,
  voidStrategyAllocationEntry,
} from '../services/strategy-allocation';
import { ValidationError } from '../utils/errors';

const weekDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const postAllocationSchema = z.object({
  allocation_type: z.string(),
  amount: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? Number.parseFloat(v) : v;
    if (Number.isNaN(n) || n <= 0) {
      throw new Error('amount must be greater than 0');
    }
    return Number(n.toFixed(2));
  }),
  note: z.string().trim().optional(),
  recorded_at: z.string().datetime().optional(),
});

export async function strategyAllocationRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get<{ Params: { weekStart: string } }>(
    '/owner-self-pay/:weekStart/period-allocations',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Period allocation summary (tax / reinvestment recorded totals; targets null until wired)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const pool = getPool();
      const dto = await buildPeriodAllocationsDto(pool, weekStartParsed.data);
      return reply.send(dto);
    }
  );

  fastify.post<{
    Params: { weekStart: string };
    Body: z.infer<typeof postAllocationSchema>;
  }>(
    '/owner-self-pay/:weekStart/allocations',
    {
      preHandler: adminPre,
      schema: {
        description: 'Record a tax or reinvestment set-aside allocation for a period week',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const weekStartParsed = weekDateSchema.safeParse(request.params.weekStart);
      if (!weekStartParsed.success) {
        throw new ValidationError('Invalid weekStart', weekStartParsed.error.errors);
      }
      const bodyParsed = postAllocationSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }

      const weekStart = weekStartParsed.data;
      const weekEndExpected = addDaysYmd(weekStart, 6);
      const {
        allocation_type: allocationTypeRaw,
        amount,
        note: noteRaw,
        recorded_at,
      } = bodyParsed.data;

      if (!isStrategyAllocationType(allocationTypeRaw)) {
        throw new ValidationError(
          `allocation_type must be TAX_SET_ASIDE or REINVESTMENT_SET_ASIDE`
        );
      }

      const noteTrim = noteRaw?.trim();
      const note = noteTrim && noteTrim.length > 0 ? noteTrim : null;
      const recordedAt = recorded_at ? new Date(recorded_at) : undefined;

      const row = await withTx(async (client) => {
        const userId = await ensureUser(client, request);
        const inserted = await insertStrategyAllocationEntry(client, {
          periodWeekStart: weekStart,
          periodWeekEnd: weekEndExpected,
          allocationType: allocationTypeRaw,
          amount,
          note,
          recordedAt,
          createdBy: userId,
        });
        await emitStrategyAllocationRecorded(
          client,
          inserted,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });

      return reply.status(201).send(toStrategyAllocationEntryDto(row));
    }
  );

  fastify.delete<{ Params: { entryId: string } }>(
    '/strategy-allocation-entries/:entryId',
    {
      preHandler: adminPre,
      schema: {
        description: 'Void a strategy allocation entry (append-only audit; sets voided_at)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const entryIdParsed = z.string().uuid().safeParse(request.params.entryId);
      if (!entryIdParsed.success) {
        throw new ValidationError('Invalid entryId', entryIdParsed.error.errors);
      }

      const entryId = entryIdParsed.data;

      await withTx(async (client) => {
        const existing = await getStrategyAllocationEntryById(client, entryId);
        if (!existing || existing.voided_at) {
          return;
        }

        const voidedAt = new Date();
        const voided = await voidStrategyAllocationEntry(client, entryId, voidedAt);
        if (!voided) return;

        await emitStrategyAllocationVoided(
          client,
          voided,
          resolveActorUserId(request.user?.cognitoSub),
          voidedAt
        );
      });

      return reply.status(204).send();
    }
  );
}
