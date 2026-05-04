import { NotFoundError } from '../utils/errors';
import { getPool } from './index';

/** Single OWNER balance account (enforced by partial unique index). */
export async function resolveOwnerAccountId(): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id
     FROM accounts
     WHERE type = 'OWNER'::account_type
       AND deleted_at IS NULL
     ORDER BY created_at ASC, id ASC
     LIMIT 1`
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('Owner account');
  }
  return (result.rows[0] as { id: string }).id;
}
