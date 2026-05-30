import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireAuth, requireRole } from '../auth/guards';
import {
  DEFAULT_STRATEGY_TYPE,
  STRATEGY_SCOPE_KEY,
  resolveStrategyValues,
} from '../constants/financial-strategy';
import { getPool } from '../db';
import {
  computeFinancialRecommendations,
  todayIsoDateUtc,
} from '../services/financial-recommendations';
import { toYyyyMmDd } from '../utils/pg-date';

interface FinancialStrategyRow {
  strategy_type: string;
  tax_reserve_bps: number;
  reinvestment_bps: number;
  cash_buffer_amount: string;
}

interface CashSnapshotRow {
  snapshot_date: string;
  amount: string;
}

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function loadStrategyDefaults() {
  const values = resolveStrategyValues(DEFAULT_STRATEGY_TYPE);
  return {
    strategy_type: DEFAULT_STRATEGY_TYPE,
    tax_reserve_bps: values.tax_reserve_bps,
    reinvestment_bps: values.reinvestment_bps,
    cash_buffer_amount: values.cash_buffer_amount,
  };
}

const recommendationResponseSchema = {
  type: 'object',
  properties: {
    available: { type: 'boolean' },
    confidence: { type: 'string' },
    snapshot_date: { type: ['string', 'null'] },
    strategy_type: { type: 'string' },
    tax_reserve_bps: { type: 'integer' },
    reinvestment_bps: { type: 'integer' },
    current_cash: { type: ['string', 'null'] },
    tax_reserve_recommendation: { type: ['string', 'null'] },
    cash_buffer_target: { type: ['string', 'null'] },
    available_after_protection: { type: ['string', 'null'] },
    reinvestment_recommendation: { type: ['string', 'null'] },
    safe_owner_draw: { type: ['string', 'null'] },
  },
};

function serializeRecommendations(result: ReturnType<typeof computeFinancialRecommendations>) {
  if (!result.available) {
    return {
      available: false,
      confidence: result.confidence,
      snapshot_date: null,
      strategy_type: result.strategy_type,
      tax_reserve_bps: result.tax_reserve_bps,
      reinvestment_bps: result.reinvestment_bps,
      current_cash: null,
      tax_reserve_recommendation: null,
      cash_buffer_target: result.cash_buffer_target,
      available_after_protection: null,
      reinvestment_recommendation: null,
      safe_owner_draw: null,
    };
  }

  return {
    available: true,
    confidence: result.confidence,
    snapshot_date: result.snapshot_date,
    strategy_type: result.strategy_type,
    tax_reserve_bps: result.tax_reserve_bps,
    reinvestment_bps: result.reinvestment_bps,
    current_cash: result.current_cash,
    tax_reserve_recommendation: result.tax_reserve_recommendation,
    cash_buffer_target: result.cash_buffer_target,
    available_after_protection: result.available_after_protection,
    reinvestment_recommendation: result.reinvestment_recommendation,
    safe_owner_draw: result.safe_owner_draw,
  };
}

export async function financialRecommendationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get(
    '/financial-recommendations',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Deterministic owner-draw and allocation recommendations from latest cash snapshot and strategy',
        security: [{ bearerAuth: [] }],
        response: {
          200: recommendationResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();

      const [snapshotResult, strategyResult] = await Promise.all([
        pool.query(
          `SELECT snapshot_date, amount
           FROM cash_snapshots
           ORDER BY snapshot_date DESC, created_at DESC
           LIMIT 1`
        ),
        pool.query(
          `SELECT strategy_type, tax_reserve_bps, reinvestment_bps, cash_buffer_amount
           FROM financial_strategy_settings
           WHERE scope_key = $1`,
          [STRATEGY_SCOPE_KEY]
        ),
      ]);

      const strategyRow = strategyResult.rows[0] as FinancialStrategyRow | undefined;
      const strategy = strategyRow
        ? {
            strategy_type: strategyRow.strategy_type,
            tax_reserve_bps: strategyRow.tax_reserve_bps,
            reinvestment_bps: strategyRow.reinvestment_bps,
            cash_buffer_amount: parseAmount(strategyRow.cash_buffer_amount),
          }
        : loadStrategyDefaults();

      const snapshotRow = snapshotResult.rows[0] as CashSnapshotRow | undefined;
      if (!snapshotRow) {
        const unavailable = computeFinancialRecommendations(null);
        return reply.send({
          ...serializeRecommendations(unavailable),
          strategy_type: strategy.strategy_type,
          tax_reserve_bps: strategy.tax_reserve_bps,
          reinvestment_bps: strategy.reinvestment_bps,
          cash_buffer_target: strategy.cash_buffer_amount.toFixed(4),
        });
      }

      const result = computeFinancialRecommendations({
        current_cash: parseAmount(snapshotRow.amount),
        snapshot_date: toYyyyMmDd(snapshotRow.snapshot_date),
        strategy: {
          strategy_type: strategy.strategy_type,
          tax_reserve_bps: strategy.tax_reserve_bps,
          reinvestment_bps: strategy.reinvestment_bps,
          cash_buffer_amount: strategy.cash_buffer_amount,
        },
        reference_date: todayIsoDateUtc(),
      });

      return reply.send(serializeRecommendations(result));
    }
  );
}
