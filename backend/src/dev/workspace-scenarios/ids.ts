/** Canonical scenario ids — keep in sync with registry entries. */
export const WORKSPACE_SCENARIO_IDS = [
  'shows-empty-week',
  'shows-typical-week',
  'shows-needs-close-out',
  'shows-busy-week',
] as const;

export type WorkspaceScenarioId = (typeof WORKSPACE_SCENARIO_IDS)[number];

export function getWorkspaceScenarioIds(): string[] {
  return [...WORKSPACE_SCENARIO_IDS];
}

export function isWorkspaceScenarioId(id: string): id is WorkspaceScenarioId {
  return (WORKSPACE_SCENARIO_IDS as readonly string[]).includes(id);
}
