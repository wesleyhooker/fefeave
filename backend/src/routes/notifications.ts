import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import {
  countUnreadWorkspaceNotificationsForUser,
  listWorkspaceNotificationsForUser,
  markAllNotificationsRead,
  markNotificationReadForUser,
} from '../services/workspace-notifications';
import { ValidationError } from '../utils/errors';

const uuidSchema = z.string().uuid();

const optionalBooleanQuery = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value === true || value === 'true';
  });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  unread_only: optionalBooleanQuery,
  since: z.string().datetime().optional(),
});

const readAllBodySchema = z.object({
  before: z.string().datetime().optional(),
});

const notificationItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    notification_type: { type: 'string' },
    severity: { type: 'string', enum: ['info', 'success', 'warning'] },
    title: { type: 'string' },
    body: { type: 'string', nullable: true },
    href: { type: 'string' },
    source_type: { type: 'string', nullable: true },
    source_id: { type: 'string', format: 'uuid', nullable: true },
    occurred_at: { type: 'string', format: 'date-time' },
    read: { type: 'boolean' },
    actor_user_id: {
      type: 'string',
      nullable: true,
      description:
        'Auth actor id at emit time (Cognito sub / dev-bypass subject). Not users.id — do not use for avatar lookup in V1.',
    },
  },
};

async function resolveRequestUserId(request: Parameters<typeof ensureUser>[1]): Promise<string> {
  return withTx(async (client) => ensureUser(client, request));
}

export async function notificationRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.get(
    '/notifications',
    {
      preHandler: adminPre,
      schema: {
        description:
          'List workspace notifications for the current user (read state is per-user). ' +
          'V1 bell dropdown: request page=1, limit=20 only — not a full history browser. ' +
          '`since` filters occurred_at >= value (incremental refresh); it is not cursor pagination. ' +
          'Offset page/limit is acceptable for V1 dropdown volume.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              default: 20,
              description: 'Bell dropdown should use the default (20).',
            },
            unread_only: { type: 'boolean' },
            since: {
              type: 'string',
              format: 'date-time',
              description:
                'Filter: occurred_at >= since. Not cursor pagination — combine with page=1 for poll refresh.',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid query parameters', parsed.error.errors);
      }

      const { page, limit, unread_only: unreadOnly, since } = parsed.data;
      const pool = getPool();
      const userId = await resolveRequestUserId(request);

      const result = await listWorkspaceNotificationsForUser(pool, {
        userId,
        page,
        limit,
        unreadOnly,
        since: since ? new Date(since) : undefined,
      });

      return reply.send(result);
    }
  );

  fastify.get(
    '/notifications/unread-count',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Unread persisted notification count for the current user (bell badge source). ' +
          'Does not include client-derived attention/action-queue count.',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const pool = getPool();
      const userId = await resolveRequestUserId(request);
      const count = await countUnreadWorkspaceNotificationsForUser(pool, userId);
      return reply.send({ count });
    }
  );

  fastify.patch(
    '/notifications/read-all',
    {
      preHandler: adminPre,
      schema: {
        description:
          'Mark all unread notifications as read for the current user. ' +
          'Optional `before` limits to notifications with occurred_at <= before.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            before: {
              type: 'string',
              format: 'date-time',
              description: 'Only mark notifications with occurred_at <= before as read.',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsedBody = readAllBodySchema.safeParse(request.body ?? {});
      if (!parsedBody.success) {
        throw new ValidationError('Invalid request body', parsedBody.error.errors);
      }

      const pool = getPool();
      const userId = await resolveRequestUserId(request);
      const markedCount = await markAllNotificationsRead(pool, userId, {
        before: parsedBody.data.before ? new Date(parsedBody.data.before) : undefined,
      });

      return reply.send({ marked_count: markedCount });
    }
  );

  fastify.patch<{ Params: { id: string } }>(
    '/notifications/:id/read',
    {
      preHandler: adminPre,
      schema: {
        description: 'Mark a notification as read for the current user. Idempotent.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: notificationItemSchema,
        },
      },
    },
    async (request, reply) => {
      const parsedId = uuidSchema.safeParse(request.params.id);
      if (!parsedId.success) {
        throw new ValidationError('Invalid notification id', parsedId.error.errors);
      }

      const pool = getPool();
      const userId = await resolveRequestUserId(request);
      const item = await markNotificationReadForUser(pool, parsedId.data, userId);
      return reply.send(item);
    }
  );
}
