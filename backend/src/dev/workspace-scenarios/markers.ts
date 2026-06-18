/** Notes / descriptions tag — never used in production data. */
export const WORKSPACE_SCENARIO_MARKER = '(workspace-scenario)';

/** Deterministic show name prefix for a scenario run. */
export function scenarioShowName(scenarioId: string, label: string): string {
  return `[${scenarioId}] ${label}`;
}

/** Extract scenario id from a tagged show name, if present. */
export function parseScenarioIdFromShowName(name: string): string | null {
  const match = name.match(/^\[([a-z0-9][a-z0-9-]*)\]/);
  return match?.[1] ?? null;
}

export function scenarioPaymentReference(scenarioId: string, suffix: string): string {
  return `scenario-${scenarioId}-${suffix}`;
}
