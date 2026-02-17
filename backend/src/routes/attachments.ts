import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool, withTx } from '../db';
import { ensureUser } from '../db/ensure-user';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  createPresignedPostForUpload,
  createPresignedDownloadUrl,
  MAX_UPLOAD_BYTES,
  PRESIGN_POST_EXPIRES_SECONDS,
  PRESIGN_GET_EXPIRES_SECONDS,
} from '../lib/s3Presign';

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
] as const;

const presignBodySchema = z.object({
  filename: z.string().min(1, 'filename is required'),
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    errorMap: () => ({ message: `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}` }),
  }),
  sizeBytes: z.number().int().min(0).max(MAX_UPLOAD_BYTES),
});

/** Sanitize filename for S3 key: safe chars only, no path segments. */
function sanitizeFilename(filename: string): string {
  const basename = filename.replace(/^.*[/\\]/, '').trim() || 'file';
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.slice(0, 255) || 'file';
}

function buildUploadKey(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  return `attachments/${randomUUID()}-${sanitized}`;
}

/** Extract suggested filename from key (part after last uuid-) for Content-Disposition. */
function filenameFromKey(key: string): string | undefined {
  if (!key.startsWith('attachments/')) return undefined;
  const afterPrefix = key.slice('attachments/'.length);
  const dashIdx = afterPrefix.indexOf('-');
  if (dashIdx === -1) return undefined;
  return afterPrefix.slice(dashIdx + 1) || undefined;
}

const createAttachmentBodySchema = z.object({
  key: z.string().min(1).refine((k) => k.startsWith('attachments/'), 'key must start with attachments/'),
  originalFilename: z.string().min(1, 'originalFilename is required'),
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    errorMap: () => ({ message: `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}` }),
  }),
  sizeBytes: z.number().int().min(0).max(MAX_UPLOAD_BYTES),
});

const uuidSchema = z.string().uuid();

export async function attachmentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.post<{ Body: z.infer<typeof presignBodySchema> }>(
    '/uploads/presign',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get a presigned POST URL for uploading an attachment to S3',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['filename', 'contentType', 'sizeBytes'],
          properties: {
            filename: { type: 'string', description: 'Original filename' },
            contentType: { type: 'string', description: 'One of: application/pdf, image/png, image/jpeg, text/csv' },
            sizeBytes: { type: 'number', description: 'File size in bytes, max 10MB' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              fields: { type: 'object', additionalProperties: { type: 'string' } },
              key: { type: 'string' },
              expiresInSeconds: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = presignBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { filename, contentType } = parsed.data;

      const key = buildUploadKey(filename);
      const result = await createPresignedPostForUpload(
        key,
        contentType,
        MAX_UPLOAD_BYTES,
        PRESIGN_POST_EXPIRES_SECONDS
      );

      return reply.send({
        url: result.url,
        fields: result.fields,
        key,
        expiresInSeconds: result.expiresInSeconds,
      });
    }
  );

  fastify.get<{ Params: { '*': string } }>(
    '/uploads/download/*',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get a presigned download URL for an attachment. Key is path after /download/ (e.g. attachments/uuid-filename.pdf).',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { '*': { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              downloadUrl: { type: 'string' },
              expiresInSeconds: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const rawKey = (request.params['*'] ?? '').replace(/^\//, '');
      const key = decodeURIComponent(rawKey);
      if (!key || !key.startsWith('attachments/')) {
        throw new ValidationError('Key must start with attachments/');
      }

      const filename = filenameFromKey(key);
      const result = await createPresignedDownloadUrl(
        key,
        PRESIGN_GET_EXPIRES_SECONDS,
        filename
      );

      return reply.send({
        downloadUrl: result.downloadUrl,
        expiresInSeconds: result.expiresInSeconds,
      });
    }
  );

  const adminPre = [requireAuth, requireRole(['ADMIN', 'OPERATOR'])];

  // --- Attachment records (Epic 2.2) ---

  fastify.post<{ Body: z.infer<typeof createAttachmentBodySchema> }>(
    '/attachments',
    {
      preHandler: adminPre,
      schema: {
        description: 'Create attachment record after client uploads via presigned POST',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['key', 'originalFilename', 'contentType', 'sizeBytes'],
          properties: {
            key: { type: 'string' },
            originalFilename: { type: 'string' },
            contentType: { type: 'string' },
            sizeBytes: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
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
      const parsed = createAttachmentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid request body', parsed.error.errors);
      }
      const { key, originalFilename, contentType, sizeBytes } = parsed.data;

      const attachment = await withTx(async (client) => {
        const userId = await ensureUser(client, request).catch(() => null);
        const existing = await client.query(
          `SELECT id, s3_key, original_filename, content_type, size_bytes, created_at
           FROM attachments WHERE s3_key = $1 AND deleted_at IS NULL`,
          [key]
        );
        if (existing.rows[0]) {
          const r = existing.rows[0] as {
            id: string;
            s3_key: string;
            original_filename: string;
            content_type: string;
            size_bytes: string;
            created_at: Date;
          };
          return {
            id: r.id,
            key: r.s3_key,
            originalFilename: r.original_filename,
            contentType: r.content_type,
            sizeBytes: Number(r.size_bytes),
            createdAt: r.created_at,
          };
        }
        const result = await client.query(
          `INSERT INTO attachments (s3_key, original_filename, content_type, size_bytes, created_by_user_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, s3_key, original_filename, content_type, size_bytes, created_at`,
          [key, originalFilename.trim(), contentType, sizeBytes, userId]
        );
        const r = result.rows[0] as {
          id: string;
          s3_key: string;
          original_filename: string;
          content_type: string;
          size_bytes: string;
          created_at: Date;
        };
        return {
          id: r.id,
          key: r.s3_key,
          originalFilename: r.original_filename,
          contentType: r.content_type,
          sizeBytes: Number(r.size_bytes),
          createdAt: r.created_at,
        };
      });
      return reply.send(attachment);
    }
  );

  fastify.get<{ Params: { attachmentId: string } }>(
    '/attachments/:attachmentId/download',
    {
      preHandler: adminPre,
      schema: {
        description: 'Get presigned download URL by attachment ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['attachmentId'],
          properties: { attachmentId: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              downloadUrl: { type: 'string' },
              expiresInSeconds: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.attachmentId);
      if (!parsed.success) {
        throw new ValidationError('Invalid attachment id', parsed.error.errors);
      }
      const attachmentId = parsed.data;
      const pool = getPool();
      const row = await pool.query(
        `SELECT id, s3_key, original_filename FROM attachments WHERE id = $1 AND deleted_at IS NULL`,
        [attachmentId]
      );
      const r = row.rows[0] as { id: string; s3_key: string; original_filename: string } | undefined;
      if (!r) {
        throw new NotFoundError('Attachment', attachmentId);
      }
      const filename = r.original_filename?.trim() || filenameFromKey(r.s3_key);
      const result = await createPresignedDownloadUrl(
        r.s3_key,
        PRESIGN_GET_EXPIRES_SECONDS,
        filename
      );
      return reply.send({
        downloadUrl: result.downloadUrl,
        expiresInSeconds: result.expiresInSeconds,
      });
    }
  );

  fastify.delete<{ Params: { attachmentId: string } }>(
    '/attachments/:attachmentId',
    {
      preHandler: adminPre,
      schema: {
        description: 'Soft-delete an attachment record (does not delete S3 object)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['attachmentId'],
          properties: { attachmentId: { type: 'string', format: 'uuid' } },
        },
        response: { 204: { type: 'null', description: 'No content' } },
      },
    },
    async (request, reply) => {
      const parsed = uuidSchema.safeParse(request.params.attachmentId);
      if (!parsed.success) {
        throw new ValidationError('Invalid attachment id', parsed.error.errors);
      }
      const attachmentId = parsed.data;
      const pool = getPool();
      const result = await pool.query(
        `UPDATE attachments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
        [attachmentId]
      );
      if (result.rowCount === 0) {
        throw new NotFoundError('Attachment', attachmentId);
      }
      return reply.status(204).send();
    }
  );
}
