import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireAuth, requireRole } from '../auth/guards';
import { getPool } from '../db';
import { readLedgerEntries } from '../read-models/ledger-entries';
import { getWholesalerStatement } from '../services/wholesaler-statement';
import { formatCurrency2dp, normalizeDateYyyyMmDd, toCsvText, todayFileDate } from '../utils/csv';
import { AppError } from '../utils/errors';

interface LinkedWholesalerContext {
  user_id: string;
  cognito_user_id: string;
  email: string;
  role: string;
  wholesaler_id: string;
  wholesaler_name: string;
}

async function resolveLinkedWholesalerContext(
  fastify: FastifyInstance,
  cognitoSub: string
): Promise<LinkedWholesalerContext> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT u.id AS user_id, u.cognito_user_id, u.email, u.role, u.wholesaler_id, w.name AS wholesaler_name
     FROM users u
     LEFT JOIN wholesalers w ON w.id = u.wholesaler_id AND w.deleted_at IS NULL
     WHERE u.cognito_user_id = $1 AND u.deleted_at IS NULL
     LIMIT 1`,
    [cognitoSub]
  );

  if (result.rows.length === 0) {
    fastify.log.warn({ cognitoSub }, 'Portal access denied: user row not found');
    throw new AppError(
      403,
      'Portal access is not provisioned for this account. Ask an admin to link your wholesaler account.',
      'WHOLESALER_NOT_LINKED'
    );
  }

  const row = result.rows[0] as {
    user_id: string;
    cognito_user_id: string;
    email: string;
    role: string;
    wholesaler_id: string | null;
    wholesaler_name: string | null;
  };

  if (!row.wholesaler_id || !row.wholesaler_name) {
    fastify.log.warn(
      { userId: row.user_id, cognitoSub },
      'Portal access denied: no wholesaler link'
    );
    throw new AppError(
      403,
      'No wholesaler is linked to this account yet. Ask an admin to complete linking.',
      'WHOLESALER_NOT_LINKED'
    );
  }

  return {
    user_id: row.user_id,
    cognito_user_id: row.cognito_user_id,
    email: row.email,
    role: row.role,
    wholesaler_id: row.wholesaler_id,
    wholesaler_name: row.wholesaler_name,
  };
}

export async function portalRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const wholesalerPre = [requireAuth, requireRole(['WHOLESALER'])];

  fastify.get(
    '/portal/me',
    {
      preHandler: wholesalerPre,
      schema: {
        description: 'Portal profile and linked wholesaler metadata',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  cognito_user_id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
              wholesaler: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
          403: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const context = await resolveLinkedWholesalerContext(fastify, request.user!.cognitoSub);
      return reply.send({
        user: {
          id: context.user_id,
          cognito_user_id: context.cognito_user_id,
          email: context.email,
          role: context.role,
        },
        wholesaler: {
          id: context.wholesaler_id,
          name: context.wholesaler_name,
        },
      });
    }
  );

  fastify.get(
    '/portal/statement',
    {
      preHandler: wholesalerPre,
      schema: {
        description: 'Portal statement for linked wholesaler',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['OWED', 'PAYMENT'] },
                date: { type: 'string' },
                amount: { type: 'string' },
                show_id: { type: 'string' },
                running_balance: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const context = await resolveLinkedWholesalerContext(fastify, request.user!.cognitoSub);
      const entries = await getWholesalerStatement(getPool(), context.wholesaler_id);
      return reply.send(entries);
    }
  );

  fastify.get(
    '/portal/statement.csv',
    {
      preHandler: wholesalerPre,
      schema: {
        description: 'Portal statement CSV export for linked wholesaler',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const context = await resolveLinkedWholesalerContext(fastify, request.user!.cognitoSub);
      const rows = await readLedgerEntries(getPool(), { wholesalerId: context.wholesaler_id });

      const header = [
        'Date',
        'Wholesaler',
        'Type',
        'Show',
        'Reference ID',
        'Description',
        'Amount',
      ];
      const csvRows = rows.map((r) => [
        normalizeDateYyyyMmDd(r.date),
        r.wholesaler,
        r.type,
        r.show ?? '',
        r.reference_id,
        r.description,
        formatCurrency2dp(r.amount),
      ]);
      const csvText = toCsvText(header, csvRows);
      const body = '\uFEFF' + csvText;
      const filename = `wholesaler-statement-${todayFileDate()}.csv`;

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(body);
    }
  );
}
