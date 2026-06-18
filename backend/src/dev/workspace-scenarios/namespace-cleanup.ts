import type { Client } from 'pg';

import { getWorkspaceScenarioIds } from './ids';
import { parseScenarioIdFromShowName } from './markers';

const SCENARIO_WHOLESALER_NAMES = [
  'Scenario Wholesaler Alpha',
  'Scenario Wholesaler Beta',
] as const;

async function collectScenarioShowIds(client: Client): Promise<string[]> {
  const registered = new Set(getWorkspaceScenarioIds());
  const { rows } = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM shows WHERE deleted_at IS NULL AND name LIKE '[%'`
  );

  return rows
    .filter((row) => {
      const scenarioId = parseScenarioIdFromShowName(row.name);
      return scenarioId != null && registered.has(scenarioId);
    })
    .map((row) => row.id);
}

async function collectScenarioFinancialEventSourceIds(
  client: Client,
  showIds: string[]
): Promise<string[]> {
  const ids = new Set<string>(showIds);

  if (showIds.length > 0) {
    const owed = await client.query<{ id: string }>(
      `SELECT id FROM owed_line_items WHERE show_id = ANY($1::uuid[])`,
      [showIds]
    );
    for (const row of owed.rows) {
      ids.add(row.id);
    }
  }

  return [...ids];
}

export async function deleteAllWorkspaceScenarioData(client: Client): Promise<void> {
  const showIds = await collectScenarioShowIds(client);
  const eventSourceIds = await collectScenarioFinancialEventSourceIds(client, showIds);

  if (eventSourceIds.length > 0) {
    await client.query(`DELETE FROM financial_events WHERE source_id = ANY($1::uuid[])`, [
      eventSourceIds,
    ]);
  }

  if (showIds.length > 0) {
    await client.query(`DELETE FROM owed_line_items WHERE show_id = ANY($1::uuid[])`, [showIds]);
    await client.query(`DELETE FROM show_financials WHERE show_id = ANY($1::uuid[])`, [showIds]);
    await client.query(`DELETE FROM shows WHERE id = ANY($1::uuid[])`, [showIds]);
  }

  const { rows: vendorRows } = await client.query<{ id: string }>(
    `SELECT id FROM wholesalers
     WHERE deleted_at IS NULL
       AND name = ANY($1::text[])`,
    [SCENARIO_WHOLESALER_NAMES]
  );
  const vendorIds = vendorRows.map((r) => r.id);
  if (vendorIds.length > 0) {
    await client.query(`DELETE FROM payments WHERE wholesaler_id = ANY($1::uuid[])`, [vendorIds]);
    await client.query(`DELETE FROM accounts WHERE legacy_wholesaler_id = ANY($1::uuid[])`, [
      vendorIds,
    ]);
    await client.query(`DELETE FROM wholesalers WHERE id = ANY($1::uuid[])`, [vendorIds]);
  }
}
