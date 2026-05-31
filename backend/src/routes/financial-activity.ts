import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import {
  FINANCIAL_EVENT_CATEGORIES,
  FINANCIAL_EVENT_TYPES,
  type FinancialEventCategory,
  type FinancialEventType,
} from '../constants/financial-events';
import { getPool } from '../db';
import {
  getFinancialActivityStats,
  isFinancialEventCategory,
  isFinancialEventType,
  listFinancialActivity,
} from '../services/financial-activity';
import { ValidationError } from '../utils/errors';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  event_category: z.string().optional(),
  event_type: z.string().optional(),
  effective_date_from: dateSchema.optional(),
  effective_date_to: dateSchema.optional(),
});

export async function financialActivityRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get(
    '/financial-activity',
    {
      preHandler: adminPre,
      schema: {
        description: 'Ledger-driven financial activity timeline (read-only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            event_category: { type: 'string', enum: [...FINANCIAL_EVENT_CATEGORIES] },
            event_type: { type: 'string', enum: [...FINANCIAL_EVENT_TYPES] },
            effective_date_from: { type: 'string', format: 'date' },
            effective_date_to: { type: 'string', format: 'date' },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid query parameters', parsed.error.errors);
      }

      const {
        page,
        limit,
        event_category: eventCategoryRaw,
        event_type: eventTypeRaw,
        effective_date_from: effectiveDateFrom,
        effective_date_to: effectiveDateTo,
      } = parsed.data;

      if (eventCategoryRaw && !isFinancialEventCategory(eventCategoryRaw)) {
        throw new ValidationError(`Unknown event_category: ${eventCategoryRaw}`);
      }
      if (eventTypeRaw && !isFinancialEventType(eventTypeRaw)) {
        throw new ValidationError(`Unknown event_type: ${eventTypeRaw}`);
      }
      if (effectiveDateFrom && effectiveDateTo && effectiveDateFrom > effectiveDateTo) {
        throw new ValidationError('effective_date_from must be on or before effective_date_to');
      }

      const pool = getPool();
      const result = await listFinancialActivity(pool, {
        page,
        limit,
        eventCategory: eventCategoryRaw as FinancialEventCategory | undefined,
        eventType: eventTypeRaw as FinancialEventType | undefined,
        effectiveDateFrom,
        effectiveDateTo,
      });

      return reply.send(result);
    }
  );

  fastify.get(
    '/financial-activity/stats',
    {
      preHandler: adminPre,
      schema: {
        description: 'Aggregate statistics for the financial event ledger (read-only)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const stats = await getFinancialActivityStats(pool);

      return reply.send(stats);
    }
  );
}
