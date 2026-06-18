/**
 * Friendly show title for UI — strips dev scenario `[scenario-id] ` prefixes.
 * Matches backend `scenarioShowName` / `parseScenarioIdFromShowName` tagging.
 */

const SCENARIO_SHOW_NAME_PREFIX = /^\[[a-z0-9][a-z0-9-]*\]\s+/;

export function formatShowDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (trimmed.length === 0) return 'Show';
  const withoutScenario = trimmed.replace(SCENARIO_SHOW_NAME_PREFIX, '').trim();
  return withoutScenario.length > 0 ? withoutScenario : trimmed;
}
