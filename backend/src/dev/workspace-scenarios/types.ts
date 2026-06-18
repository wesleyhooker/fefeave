import type { Client } from 'pg';

/** Workspace areas a scenario is intended to exercise (for docs and future routing). */
export type WorkspaceScenarioDomain =
  | 'shows'
  | 'dashboard'
  | 'vendors'
  | 'purchases'
  | 'business-health';

export type WorkspaceScenarioContext = {
  client: Client;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  formatYmd: (d: Date) => string;
  addDays: (d: Date, days: number) => Date;
};

export type WorkspaceScenarioDefinition = {
  id: string;
  description: string;
  domains: readonly WorkspaceScenarioDomain[];
  run: (ctx: WorkspaceScenarioContext) => Promise<void>;
};

export type WorkspaceScenarioRunResult = {
  scenarioId: string;
  description: string;
  domains: readonly WorkspaceScenarioDomain[];
};
