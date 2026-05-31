import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  emitShowPayoutOnShowStatusChange,
  resolveActorUserId,
} from '../services/financial-event-emission';

const PLATFORM_API = ['WHATNOT', 'INSTAGRAM', 'OTHER'] as const;
const PLATFORM_DB = ['WHATNOT', 'INSTAGRAM', 'MANUAL'] as const;
/** Maps API platform value to DB enum (OTHER -> MANUAL) */
function toDbPlatform(api: string): (typeof PLATFORM_DB)[number] {
  return api === 'OTHER' ? 'MANUAL' : (api as (typeof PLATFORM_DB)[number]);
}

/** Maps DB platform value to API enum (MANUAL -> OTHER). Responses always use WHATNOT | INSTAGRAM | OTHER. */
function toApiPlatform(db: string | null): (typeof PLATFORM_API)[number] {
  return db === 'MANUAL' ? 'OTHER' : (db as (typeof PLATFORM_API)[number]);
}

interface ShowRow {
  id: string;
  show_date: string;
  platform: string;
  name: string;
  notes: string | null;
  external_reference: string | null;
  started_at: Date | null;
  ended_at: Date | null;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

/** Columns selected/returned for show rows (kept in one place so new fields stay in sync). */
const SHOW_COLUMNS =
  'id, show_date, platform, name, notes, external_reference, started_at, ended_at, status, created_at, updated_at';

function serializeShow(row: ShowRow) {
  return {
    id: row.id,
    show_date: row.show_date,
    platform: toApiPlatform(row.platform),
    name: row.name,
    notes: row.notes ?? undefined,
    external_reference: row.external_reference ?? undefined,
    started_at: row.started_at ?? undefined,
    ended_at: row.ended_at ?? undefined,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Response schema properties shared by all show endpoints. */
const showResponseProperties = {
  id: { type: 'string' },
  show_date: { type: 'string' },
  platform: { type: 'string' },
  name: { type: 'string' },
  notes: { type: 'string' },
  external_reference: { type: 'string' },
  started_at: { type: 'string' },
  ended_at: { type: 'string' },
  status: { type: 'string' },
  created_at: { type: 'string' },
  updated_at: { type: 'string' },
} as const;

/** Blank string -> undefined so empty optional timestamps are treated as omitted. */
const blankToUndefined = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/** Optional ISO 8601 timestamp (offsets allowed, e.g. the frontend's Date.toISOString()). */
const optionalIsoTimestamp = z.preprocess(
  blankToUndefined,
  z.string().datetime({ offset: true }).optional()
);

const postShowSchema = z
  .object({
    show_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'show_date must be YYYY-MM-DD'),
    platform: z.enum(PLATFORM_API),
    name: z.string().optional(),
    external_reference: z.string().optional(),
    notes: z.string().optional(),
    // Optional show duration (capture only). Backward compatible — old clients omit these.
    started_at: optionalIsoTimestamp,
    ended_at: optionalIsoTimestamp,
  })
  .refine(
    (d) =>
      !(d.started_at && d.ended_at) ||
      new Date(d.ended_at).getTime() > new Date(d.started_at).getTime(),
    { message: 'ended_at must be after started_at', path: ['ended_at'] }
  );

const uuidSchema = z.string().uuid();

export async function showRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postShowSchema> }>(
    '/shows',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a show',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['show_date', 'platform'],
          properties: {
            show_date: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
            platform: { type: 'string', enum: PLATFORM_API },
            name: { type: 'string' },
            external_reference: { type: 'string' },
            notes: { type: 'string' },
            started_at: { type: 'string', format: 'date-time' },
            ended_at: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: showResponseProperties,
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postShowSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { show_date, platform, name, external_reference, notes, started_at, ended_at } =
        parsed.data;

      const show = await withTx(async (client) => {
        const userId = await ensureUser(client, request);
        const dbPlatform = toDbPlatform(platform);
        const showName = (name ?? '').trim() || 'Untitled';
        const result = await client.query(
          `INSERT INTO shows (name, show_date, platform, source, external_reference, notes, started_at, ended_at, created_by, created_via)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'API')
           RETURNING ${SHOW_COLUMNS}`,
          [
            showName,
            show_date,
            dbPlatform,
            dbPlatform,
            external_reference ?? null,
            notes ?? null,
            started_at ?? null,
            ended_at ?? null,
            userId,
          ]
        );
        return result.rows[0];
      });

      return reply.status(201).send(serializeShow(show as ShowRow));
    }
  );

  fastify.get(
    '/shows',
    {
      preHandler: adminPre,
      schema: {
        description: 'List shows',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: showResponseProperties,
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT ${SHOW_COLUMNS}
         FROM shows
         WHERE deleted_at IS NULL
         ORDER BY show_date DESC, created_at DESC`
      );
      const rows = result.rows as ShowRow[];
      return reply.send(rows.map(serializeShow));
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/shows/:id',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get a show by id',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: showResponseProperties,
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.id);
      if (!parsed.success) {
        throw new ValidationError('Invalid show id', parsed.error.errors);
      }
      const id = parsed.data;

      const pool = getPool();
      const result = await pool.query(
        `SELECT ${SHOW_COLUMNS}
         FROM shows
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      const row = result.rows[0] as ShowRow | undefined;
      if (!row) {
        throw new NotFoundError('Show', id);
      }
      return reply.send(serializeShow(row));
    }
  );

  const patchShowSchema = z.object({
    status: z.enum(['ACTIVE', 'COMPLETED']),
  });

  fastify.patch<{ Params: { id: string }; Body: z.infer<typeof patchShowSchema> }>(
    '/shows/:id',
    {
      preHandler: adminPre,
      schema: {
        description: 'Update show (e.g. set status to COMPLETED to close show)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['ACTIVE', 'COMPLETED'] } },
        },
        response: {
          200: {
            type: 'object',
            properties: showResponseProperties,
          },
        },
      },
    },
    async (request, reply) => {
      const parsedId = uuidSchema.safeParse(request.params.id);
      if (!parsedId.success) {
        throw new ValidationError('Invalid show id', parsedId.error.errors);
      }
      const bodyParsed = patchShowSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const id = parsedId.data;
      const { status } = bodyParsed.data;

      const row = await withTx(async (client) => {
        const result = await client.query(
          `UPDATE shows SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL
           RETURNING ${SHOW_COLUMNS}`,
          [status, id]
        );
        const updated = result.rows[0] as ShowRow | undefined;
        if (!updated) {
          throw new NotFoundError('Show', id);
        }
        await emitShowPayoutOnShowStatusChange(
          client,
          id,
          status,
          resolveActorUserId(request.user?.cognitoSub)
        );
        return updated;
      });
      return reply.send(serializeShow(row));
    }
  );

  const linkAttachmentBodySchema = z.object({
    attachmentId: z.string().uuid(),
  });

  fastify.post<{ Params: { showId: string }; Body: z.infer<typeof linkAttachmentBodySchema> }>(
    '/shows/:showId/attachments',
    {
      preHandler: adminPre,
      schema: {
        description: 'Link an attachment to a show',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['attachmentId'],
          properties: { attachmentId: { type: 'string', format: 'uuid' } },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              showId: { type: 'string' },
              attachmentId: { type: 'string' },
              id: { type: 'string' },
              key: { type: 'string' },
              originalFilename: { type: 'string' },
              contentType: { type: 'string' },
              sizeBytes: { type: 'number' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const showIdParsed = uuidSchema.safeParse(request.params.showId);
      if (!showIdParsed.success) {
        throw new ValidationError('Invalid show id', showIdParsed.error.errors);
      }
      const bodyParsed = linkAttachmentBodySchema.safeParse(request.body);
      if (!bodyParsed.success) {
        throw new ValidationError('Invalid request body', bodyParsed.error.errors);
      }
      const showId = showIdParsed.data;
      const attachmentId = bodyParsed.data.attachmentId;

      const pool = getPool();
      const showRow = await pool.query(
        'SELECT id FROM shows WHERE id = $1 AND deleted_at IS NULL',
        [showId]
      );
      if (showRow.rows.length === 0) {
        throw new NotFoundError('Show', showId);
      }
      const attRow = await pool.query(
        'SELECT id, s3_key, original_filename, content_type, size_bytes, created_at FROM attachments WHERE id = $1 AND deleted_at IS NULL',
        [attachmentId]
      );
      if (attRow.rows.length === 0) {
        throw new NotFoundError('Attachment', attachmentId);
      }
      const att = attRow.rows[0] as {
        id: string;
        s3_key: string;
        original_filename: string;
        content_type: string;
        size_bytes: string;
        created_at: Date;
      };
      await pool.query(
        `INSERT INTO show_attachments (show_id, attachment_id)
         VALUES ($1, $2)
         ON CONFLICT (show_id, attachment_id) DO NOTHING`,
        [showId, attachmentId]
      );
      return reply.status(201).send({
        showId,
        attachmentId: att.id,
        id: att.id,
        key: att.s3_key,
        originalFilename: att.original_filename,
        contentType: att.content_type,
        sizeBytes: Number(att.size_bytes),
        createdAt: att.created_at,
      });
    }
  );

  fastify.get<{ Params: { showId: string } }>(
    '/shows/:showId/attachments',
    {
      preHandler: adminPre,
      schema: {
        description: 'List attachments linked to a show (excludes soft-deleted)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['showId'],
          properties: { showId: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                key: { type: 'string' },
                filename: { type: 'string' },
                contentType: { type: 'string' },
                sizeBytes: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.showId);
      if (!parsed.success) {
        throw new ValidationError('Invalid show id', parsed.error.errors);
      }
      const showId = parsed.data;
      const pool = getPool();
      const showExists = await pool.query(
        'SELECT 1 FROM shows WHERE id = $1 AND deleted_at IS NULL',
        [showId]
      );
      if (showExists.rows.length === 0) {
        throw new NotFoundError('Show', showId);
      }
      const result = await pool.query(
        `SELECT a.id, a.s3_key, a.original_filename, a.content_type, a.size_bytes, a.created_at
         FROM attachments a
         INNER JOIN show_attachments sa ON sa.attachment_id = a.id
         WHERE sa.show_id = $1 AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC`,
        [showId]
      );
      const rows = result.rows as Array<{
        id: string;
        s3_key: string;
        original_filename: string;
        content_type: string;
        size_bytes: string;
        created_at: Date;
      }>;
      return reply.send(
        rows.map((r) => ({
          id: r.id,
          key: r.s3_key,
          filename: r.original_filename,
          contentType: r.content_type,
          sizeBytes: Number(r.size_bytes),
          createdAt: r.created_at,
        }))
      );
    }
  );
}
