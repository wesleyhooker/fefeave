/**
 * Dev-only CLI: load a named workspace scenario into the local database.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/run-workspace-scenario.ts shows-typical-week
 *   DATABASE_URL=... npx tsx scripts/run-workspace-scenario.ts --list
 *   DATABASE_URL=... npx tsx scripts/run-workspace-scenario.ts --reset
 *
 * Or: make dev-scenario SCENARIO=shows-typical-week
 */

import {
  listScenariosForCli,
  resetWorkspaceScenarios,
  runWorkspaceScenario,
} from '../src/dev/workspace-scenarios/run';

function printUsage(): void {
  console.log(`Workspace scenario runner (dev only)

Usage:
  tsx scripts/run-workspace-scenario.ts <scenario-id>
  tsx scripts/run-workspace-scenario.ts --list
  tsx scripts/run-workspace-scenario.ts --reset

Examples:
  make dev-scenario SCENARIO=shows-typical-week
  make dev-scenario-list
`);
}

async function main(): Promise<void> {
  const arg = process.argv[2];

  if (!arg || arg === '--help' || arg === '-h') {
    printUsage();
    process.exit(arg ? 0 : 1);
  }

  if (arg === '--list') {
    const scenarios = listScenariosForCli();
    for (const scenario of scenarios) {
      console.log(`${scenario.scenarioId}`);
      console.log(`  ${scenario.description}`);
      console.log(`  domains: ${scenario.domains.join(', ')}`);
    }
    return;
  }

  if (arg === '--reset') {
    await resetWorkspaceScenarios();
    console.log('Cleared all workspace-scenario tagged data.');
    return;
  }

  const result = await runWorkspaceScenario(arg);
  console.log(`Loaded workspace scenario: ${result.scenarioId}`);
  console.log(result.description);
  console.log(`Domains: ${result.domains.join(', ')}`);
  console.log('Open /admin/shows to verify (local dev auth bypass).');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
