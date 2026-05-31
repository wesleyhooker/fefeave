import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { CASH_SNAPSHOT_SOURCES, DEFAULT_CASH_SNAPSHOT_SOURCE } from '../constants/cash-snapshots';
import { getPool, withTx } from '../db';
import { ValidationError } from '../utils/errors';
import { toYyyyMmDd } from '../utils/pg-date';
import { emitCashSnapshotRecorded, resolveActorUserId } from '../services/financial-event-emission';

const optionalTrimmedNotes = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().max(2000).optional());

const postCashSnapshotSchema = z.object({
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'snapshot_date must be YYYY-MM-DD'),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? parseFloat(v) : v))
    .pipe(
      z
        .number({
          invalid_type_error: 'amount must be a number',
          required_error: 'amount is required',
        })
        .min(0, 'amount must be greater than or equal to 0')
    ),
  source: z.enum(CASH_SNAPSHOT_SOURCES).optional().default(DEFAULT_CASH_SNAPSHOT_SOURCE),
  notes: optionalTrimmedNotes,
});

interface CashSnapshotRow {
  id: string;
  snapshot_date: string;
  amount: string;
  source: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const cashSnapshotResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    snapshot_date: { type: 'string' },
    amount: { type: 'string' },
    source: { type: 'string' },
    notes: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
};

function serializeCashSnapshot(row: CashSnapshotRow) {
  return {
    id: row.id,
    snapshot_date: toYyyyMmDd(row.snapshot_date),
    amount: row.amount,
    source: row.source,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function cashSnapshotRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get(
    '/cash-snapshots/latest',
    {
      preHandler: adminPre,
      schema: {
        description: 'Most recent business-wide cash snapshot, or null if none recorded',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            oneOf: [cashSnapshotResponseSchema, { type: 'null' }],
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, snapshot_date, amount, source, notes, created_at, updated_at
         FROM cash_snapshots
         ORDER BY snapshot_date DESC, created_at DESC
         LIMIT 1`
      );
      const row = result.rows[0] as CashSnapshotRow | undefined;
      if (!row) {
        return reply.send(null);
      }
      return reply.send(serializeCashSnapshot(row));
    }
  );

  fastify.post<{ Body: z.infer<typeof postCashSnapshotSchema> }>(
    '/cash-snapshots',
    {
      preHandler: adminPre,
      schema: {
        description: 'Record a manual business-wide cash snapshot',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            snapshot_date: { type: 'string', format: 'date' },
            amount: { type: 'number' },
            source: {
              type: 'string',
              description: `One of: ${CASH_SNAPSHOT_SOURCES.join(', ')}`,
            },
            notes: { type: 'string' },
          },
        },
        response: {
          201: cashSnapshotResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = postCashSnapshotSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { snapshot_date, amount, source, notes } = parsed.data;
      const row = await withTx(async (client) => {
        const result = await client.query(
          `INSERT INTO cash_snapshots (snapshot_date, amount, source, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id, snapshot_date, amount, source, notes, created_at, updated_at`,
          [snapshot_date, amount, source, notes ?? null]
        );
        const inserted = result.rows[0] as CashSnapshotRow;
        await emitCashSnapshotRecorded(
          client,
          inserted,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });
      return reply.status(201).send(serializeCashSnapshot(row));
    }
  );
}
