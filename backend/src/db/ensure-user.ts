import { PoolClient } from 'pg';
import type { FastifyRequest } from 'fastify';
import type { AuthUser } from '../auth/types';

/**
 * Upsert a users row by cognito_user_id. Sets email if available, role from request.user.roles.
 * Returns users.id for use as created_by. Transaction-safe; pass client from within a transaction.
 */
export async function ensureUser(
  client: PoolClient,
  request: FastifyRequest & { user?: AuthUser }
): Promise<string> {
  const user = request.user!;
  const cognitoSub = user.cognitoSub;
  const email = user.email?.trim() || `user-${cognitoSub}@fefeave.local`;
  const role = user.roles?.includes('ADMIN') ? 'ADMIN' : 'OPERATOR';

  const placeholderEmail = `user-${cognitoSub}@fefeave.local`;
  const res = await client.query(
    `INSERT INTO users (cognito_user_id, email, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (cognito_user_id) DO UPDATE SET
       email = CASE
         WHEN trim(EXCLUDED.email) = '' THEN users.email
         WHEN EXCLUDED.email = $4 THEN users.email
         ELSE EXCLUDED.email
       END,
       role = EXCLUDED.role,
       updated_at = NOW()
     RETURNING id`,
    [cognitoSub, email, role, placeholderEmail]
  );
  return res.rows[0].id;
}
