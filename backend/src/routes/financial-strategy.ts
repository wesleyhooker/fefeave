import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import {
  DEFAULT_STRATEGY_TYPE,
  STRATEGY_SCOPE_KEY,
  STRATEGY_TYPES,
  isPresetStrategyType,
  resolveStrategyValues,
} from '../constants/financial-strategy';
import { getPool, withTx } from '../db';
import { ValidationError } from '../utils/errors';
import {
  emitFinancialStrategyChanged,
  resolveActorUserId,
} from '../services/financial-event-emission';

const bpsSchema = z
  .number({ invalid_type_error: 'must be a number' })
  .int('must be an integer')
  .min(0, 'must be between 0 and 10000')
  .max(10000, 'must be between 0 and 10000');

const cashBufferSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? parseFloat(v) : v))
  .pipe(
    z
      .number({
        invalid_type_error: 'cash_buffer_amount must be a number',
      })
      .min(0, 'cash_buffer_amount must be >= 0')
  );

const putFinancialStrategySchema = z
  .object({
    strategy_type: z.enum(STRATEGY_TYPES),
    tax_reserve_bps: bpsSchema.optional(),
    reinvestment_bps: bpsSchema.optional(),
    cash_buffer_amount: cashBufferSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.strategy_type === 'CUSTOM') {
      if (data.tax_reserve_bps === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'tax_reserve_bps is required when strategy_type is CUSTOM',
          path: ['tax_reserve_bps'],
        });
      }
      if (data.reinvestment_bps === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'reinvestment_bps is required when strategy_type is CUSTOM',
          path: ['reinvestment_bps'],
        });
      }
      if (data.cash_buffer_amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'cash_buffer_amount is required when strategy_type is CUSTOM',
          path: ['cash_buffer_amount'],
        });
      }
      if (
        data.tax_reserve_bps !== undefined &&
        data.reinvestment_bps !== undefined &&
        data.tax_reserve_bps + data.reinvestment_bps > 10000
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'tax_reserve_bps plus reinvestment_bps must not exceed 10000 (100%)',
          path: ['reinvestment_bps'],
        });
      }
    }
  });

interface FinancialStrategyRow {
  id: string;
  scope_key: string;
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: string;
  created_at: Date;
  updated_at: Date;
}

function buildDefaultRow(): FinancialStrategyRow {
  const values = resolveStrategyValues(DEFAULT_STRATEGY_TYPE);
  return {
    id: '00000000-0000-0000-0000-000000000000',
    scope_key: STRATEGY_SCOPE_KEY,
    strategy_type: DEFAULT_STRATEGY_TYPE,
    tax_reserve_bps: values.tax_reserve_bps,
    reinvestment_bps: values.reinvestment_bps,
    cash_buffer_amount: values.cash_buffer_amount.toFixed(4),
    created_at: new Date(0),
    updated_at: new Date(0),
  };
}

function serializeRow(row: FinancialStrategyRow, isDefault = false) {
  return {
    id: isDefault ? undefined : row.id,
    strategy_type: row.strategy_type,
    tax_reserve_bps: row.tax_reserve_bps,
    reinvestment_bps: row.reinvestment_bps,
    cash_buffer_amount: row.cash_buffer_amount,
    created_at: isDefault ? undefined : row.created_at,
    updated_at: isDefault ? undefined : row.updated_at,
    is_default: isDefault,
  };
}

export async function financialStrategyRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get(
    '/financial-strategy',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get current global financial strategy settings',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              strategy_type: { type: 'string' },
              tax_reserve_bps: { type: 'integer' },
              reinvestment_bps: { type: 'integer' },
              cash_buffer_amount: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              is_default: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, scope_key, strategy_type, tax_reserve_bps, reinvestment_bps,
                cash_buffer_amount, created_at, updated_at
         FROM financial_strategy_settings
         WHERE scope_key = $1`,
        [STRATEGY_SCOPE_KEY]
      );
      if (result.rows.length === 0) {
        return reply.send(serializeRow(buildDefaultRow(), true));
      }
      return reply.send(serializeRow(result.rows[0] as FinancialStrategyRow));
    }
  );

  fastify.put<{ Body: z.infer<typeof putFinancialStrategySchema> }>(
    '/financial-strategy',
    {
      preHandler: adminPre,
      schema: {
        description: 'Update global financial strategy settings',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['strategy_type'],
          properties: {
            strategy_type: { type: 'string' },
            tax_reserve_bps: { type: 'integer' },
            reinvestment_bps: { type: 'integer' },
            cash_buffer_amount: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              strategy_type: { type: 'string' },
              tax_reserve_bps: { type: 'integer' },
              reinvestment_bps: { type: 'integer' },
              cash_buffer_amount: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              is_default: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = putFinancialStrategySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount } = parsed.data;

      // Preset strategies always persist canonical values server-side (Option A).
      const resolved = isPresetStrategyType(strategy_type)
        ? resolveStrategyValues(strategy_type)
        : resolveStrategyValues(strategy_type, {
            tax_reserve_bps,
            reinvestment_bps,
            cash_buffer_amount,
          });

      const row = await withTx(async (client) => {
        const result = await client.query(
          `INSERT INTO financial_strategy_settings
             (scope_key, strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (scope_key) DO UPDATE SET
             strategy_type = EXCLUDED.strategy_type,
             tax_reserve_bps = EXCLUDED.tax_reserve_bps,
             reinvestment_bps = EXCLUDED.reinvestment_bps,
             cash_buffer_amount = EXCLUDED.cash_buffer_amount,
             updated_at = NOW()
           RETURNING id, scope_key, strategy_type, tax_reserve_bps, reinvestment_bps,
                     cash_buffer_amount, created_at, updated_at`,
          [
            STRATEGY_SCOPE_KEY,
            strategy_type,
            resolved.tax_reserve_bps,
            resolved.reinvestment_bps,
            resolved.cash_buffer_amount,
          ]
        );
        const inserted = result.rows[0] as FinancialStrategyRow;
        await emitFinancialStrategyChanged(
          client,
          inserted,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return inserted;
      });
      return reply.send(serializeRow(row));
    }
  );
}
