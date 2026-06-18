import { Client, Pool } from 'pg';

import { addDaysLocal, formatYmdLocal, startOfWeekMondayLocal } from './dates';
import { ensureWorkspaceScenarioDevUser } from './dev-user';
import { deleteAllWorkspaceScenarioData } from './namespace-cleanup';
import { getWorkspaceScenario, listWorkspaceScenarios } from './registry';
import { assertWorkspaceScenarioEnvironmentSafe } from './safety';
import type { WorkspaceScenarioContext, WorkspaceScenarioRunResult } from './types';
import { runFinancialEventsBackfill } from '../../services/financial-events-backfill';

export type RunWorkspaceScenarioOptions = {
  databaseUrl?: string;
  /** When true, only remove scenario-tagged rows (no insert). */
  resetOnly?: boolean;
};

export function listScenariosForCli(): WorkspaceScenarioRunResult[] {
  return listWorkspaceScenarios().map((scenario) => ({
    scenarioId: scenario.id,
    description: scenario.description,
    domains: scenario.domains,
  }));
}

export async function runWorkspaceScenario(
  scenarioId: string,
  options: RunWorkspaceScenarioOptions = {}
): Promise<WorkspaceScenarioRunResult> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  assertWorkspaceScenarioEnvironmentSafe({ databaseUrl });

  const scenario = getWorkspaceScenario(scenarioId);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const weekStart = startOfWeekMondayLocal();
  const weekEnd = addDaysLocal(weekStart, 6);

  const ctx: WorkspaceScenarioContext = {
    client,
    userId: '',
    weekStart,
    weekEnd,
    formatYmd: formatYmdLocal,
    addDays: addDaysLocal,
  };

  try {
    await client.query('BEGIN');
    ctx.userId = await ensureWorkspaceScenarioDevUser(client);
    await deleteAllWorkspaceScenarioData(client);

    if (!options.resetOnly) {
      await scenario.run(ctx);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  if (!options.resetOnly) {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await runFinancialEventsBackfill(pool, { dryRun: false });
    } finally {
      await pool.end();
    }
  }

  return {
    scenarioId: scenario.id,
    description: scenario.description,
    domains: scenario.domains,
  };
}

export async function resetWorkspaceScenarios(
  options: RunWorkspaceScenarioOptions = {}
): Promise<void> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  assertWorkspaceScenarioEnvironmentSafe({ databaseUrl });

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await deleteAllWorkspaceScenarioData(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
