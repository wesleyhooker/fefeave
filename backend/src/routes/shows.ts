import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { NotFoundError, ValidationError } from '../utils/errors';

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

const postShowSchema = z.object({
  show_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'show_date must be YYYY-MM-DD'),
  platform: z.enum(PLATFORM_API),
  name: z.string().optional(),
  external_reference: z.string().optional(),
  notes: z.string().optional(),
});

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
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              show_date: { type: 'string' },
              platform: { type: 'string' },
              name: { type: 'string' },
              notes: { type: 'string' },
              external_reference: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postShowSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { show_date, platform, name, external_reference, notes } = parsed.data;

      const show = await withTx(async (client) => {
        const userId = await ensureUser(client, request);
        const dbPlatform = toDbPlatform(platform);
        const showName = (name ?? '').trim() || 'Untitled';
        const result = await client.query(
          `INSERT INTO shows (name, show_date, platform, source, external_reference, notes, created_by, created_via)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'API')
           RETURNING id, show_date, platform, name, notes, external_reference, created_at, updated_at`,
          [
            showName,
            show_date,
            dbPlatform,
            dbPlatform,
            external_reference ?? null,
            notes ?? null,
            userId,
          ]
        );
        return result.rows[0];
      });

      const row = show as {
        id: string;
        show_date: string;
        platform: string;
        name: string;
        notes: string | null;
        external_reference: string | null;
        created_at: Date;
        updated_at: Date;
      };
      return reply.status(201).send({
        id: row.id,
        show_date: row.show_date,
        platform: toApiPlatform(row.platform),
        name: row.name,
        notes: row.notes ?? undefined,
        external_reference: row.external_reference ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
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
              properties: {
                id: { type: 'string' },
                show_date: { type: 'string' },
                platform: { type: 'string' },
                name: { type: 'string' },
                notes: { type: 'string' },
                external_reference: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, show_date, platform, name, notes, external_reference, created_at, updated_at
         FROM shows
         WHERE deleted_at IS NULL
         ORDER BY show_date DESC, created_at DESC`
      );
      const rows = result.rows as Array<{
        id: string;
        show_date: string;
        platform: string;
        name: string;
        notes: string | null;
        external_reference: string | null;
        created_at: Date;
        updated_at: Date;
      }>;
      return reply.send(
        rows.map((r) => ({
          id: r.id,
          show_date: r.show_date,
          platform: toApiPlatform(r.platform),
          name: r.name,
          notes: r.notes ?? undefined,
          external_reference: r.external_reference ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
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
            properties: {
              id: { type: 'string' },
              show_date: { type: 'string' },
              platform: { type: 'string' },
              name: { type: 'string' },
              notes: { type: 'string' },
              external_reference: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
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
        `SELECT id, show_date, platform, name, notes, external_reference, created_at, updated_at
         FROM shows
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      const row = result.rows[0] as
        | {
            id: string;
            show_date: string;
            platform: string;
            name: string;
            notes: string | null;
            external_reference: string | null;
            created_at: Date;
            updated_at: Date;
          }
        | undefined;
      if (!row) {
        throw new NotFoundError('Show', id);
      }
      return reply.send({
        id: row.id,
        show_date: row.show_date,
        platform: toApiPlatform(row.platform),
        name: row.name,
        notes: row.notes ?? undefined,
        external_reference: row.external_reference ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );
}
