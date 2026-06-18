import type { Client } from 'pg';

const SCENARIO_USER_COGNITO_ID = 'seed-dev-user';
const SCENARIO_USER_EMAIL = 'local@fefeave.local';

export async function ensureWorkspaceScenarioDevUser(client: Client): Promise<string> {
  const userRes = await client.query(
    `INSERT INTO users (cognito_user_id, email, role)
     VALUES ($1, $2, 'ADMIN')
     ON CONFLICT (email) DO UPDATE SET
       cognito_user_id = EXCLUDED.cognito_user_id,
       role = EXCLUDED.role,
       updated_at = NOW()
     RETURNING id`,
    [SCENARIO_USER_COGNITO_ID, SCENARIO_USER_EMAIL]
  );
  return userRes.rows[0].id as string;
}
