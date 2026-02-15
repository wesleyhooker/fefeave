import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { ValidationError } from '../utils/errors';

const postWholesalerSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'name must not be empty')),
  contact_email: z.union([z.string().email(), z.literal('')]).optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function wholesalerRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  fastify.post<{ Body: z.infer<typeof postWholesalerSchema> }>(
    '/wholesalers',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create a wholesaler',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            contact_email: { type: 'string' },
            contact_phone: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              contact_email: { type: 'string' },
              contact_phone: { type: 'string' },
              notes: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = postWholesalerSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { name, contact_email, contact_phone, notes } = parsed.data;
      const email = contact_email?.trim() || null;

      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO wholesalers (name, contact_email, contact_phone, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, contact_email, contact_phone, notes, created_at, updated_at`,
        [name, email, contact_phone ?? null, notes ?? null]
      );
      const row = result.rows[0] as {
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      };

      return reply.status(201).send({
        id: row.id,
        name: row.name,
        contact_email: row.contact_email ?? undefined,
        contact_phone: row.contact_phone ?? undefined,
        notes: row.notes ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
  );

  fastify.get(
    '/wholesalers',
    {
      preHandler: adminPre,
      schema: {
        description: 'List wholesalers',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                contact_email: { type: 'string' },
                contact_phone: { type: 'string' },
                notes: { type: 'string' },
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
        `SELECT id, name, contact_email, contact_phone, notes, created_at, updated_at
         FROM wholesalers
         WHERE deleted_at IS NULL
         ORDER BY LOWER(name) ASC`
      );
      const rows = result.rows as Array<{
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>;
      return reply.send(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          contact_email: r.contact_email ?? undefined,
          contact_phone: r.contact_phone ?? undefined,
          notes: r.notes ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }))
      );
    }
  );
}
