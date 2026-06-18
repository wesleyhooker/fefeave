import {
  parseScenarioIdFromShowName,
  scenarioShowName,
  WORKSPACE_SCENARIO_MARKER,
} from '../dev/workspace-scenarios/markers';
import {
  getWorkspaceScenario,
  listWorkspaceScenarios,
  WORKSPACE_SCENARIO_REGISTRY,
} from '../dev/workspace-scenarios/registry';
import { assertWorkspaceScenarioEnvironmentSafe } from '../dev/workspace-scenarios/safety';
import { WORKSPACE_SCENARIO_IDS } from '../dev/workspace-scenarios/ids';

describe('workspace scenarios', () => {
  describe('registry', () => {
    it('lists every canonical scenario id with a runner', () => {
      expect(listWorkspaceScenarios()).toHaveLength(WORKSPACE_SCENARIO_IDS.length);
      for (const id of WORKSPACE_SCENARIO_IDS) {
        const scenario = getWorkspaceScenario(id);
        expect(scenario.id).toBe(id);
        expect(scenario.description.length).toBeGreaterThan(10);
        expect(scenario.domains.length).toBeGreaterThan(0);
        expect(typeof scenario.run).toBe('function');
      }
    });

    it('rejects unknown scenario ids', () => {
      expect(() => getWorkspaceScenario('not-a-scenario')).toThrow(/Unknown workspace scenario/);
    });

    it('keeps registry keys aligned with WORKSPACE_SCENARIO_IDS', () => {
      expect(Object.keys(WORKSPACE_SCENARIO_REGISTRY).sort()).toEqual(
        [...WORKSPACE_SCENARIO_IDS].sort()
      );
    });
  });

  describe('markers', () => {
    it('round-trips scenario id in show names', () => {
      const name = scenarioShowName('shows-typical-week', 'Friday Night Live');
      expect(name).toBe('[shows-typical-week] Friday Night Live');
      expect(parseScenarioIdFromShowName(name)).toBe('shows-typical-week');
    });

    it('tags vendor notes with workspace scenario marker', () => {
      expect(WORKSPACE_SCENARIO_MARKER).toBe('(workspace-scenario)');
    });
  });

  describe('safety guards', () => {
    const localUrl = 'postgres://fefeave:fefeave@localhost:5432/fefeave';

    it('allows local development database', () => {
      expect(() =>
        assertWorkspaceScenarioEnvironmentSafe({
          nodeEnv: 'development',
          databaseUrl: localUrl,
        })
      ).not.toThrow();
    });

    it('blocks production NODE_ENV', () => {
      expect(() =>
        assertWorkspaceScenarioEnvironmentSafe({
          nodeEnv: 'production',
          databaseUrl: localUrl,
        })
      ).toThrow(/NODE_ENV=production/);
    });

    it('blocks remote database hosts by default', () => {
      expect(() =>
        assertWorkspaceScenarioEnvironmentSafe({
          nodeEnv: 'development',
          databaseUrl: 'postgres://user:pass@ep-cool-name-123456.us-west-2.aws.neon.tech/neondb',
        })
      ).toThrow(/local databases|blocked for host pattern/);
    });

    it('blocks prod-like database URLs', () => {
      expect(() =>
        assertWorkspaceScenarioEnvironmentSafe({
          nodeEnv: 'development',
          databaseUrl: 'postgres://user:pass@localhost:5432/fefeave_prod',
          allowRemote: true,
        })
      ).toThrow(/prod\/staging/);
    });

    it('respects explicit disable flag', () => {
      const prev = process.env.FEFEAVE_WORKSPACE_SCENARIO_DISABLED;
      process.env.FEFEAVE_WORKSPACE_SCENARIO_DISABLED = '1';
      try {
        expect(() =>
          assertWorkspaceScenarioEnvironmentSafe({
            nodeEnv: 'development',
            databaseUrl: localUrl,
          })
        ).toThrow(/disabled/);
      } finally {
        if (prev === undefined) {
          delete process.env.FEFEAVE_WORKSPACE_SCENARIO_DISABLED;
        } else {
          process.env.FEFEAVE_WORKSPACE_SCENARIO_DISABLED = prev;
        }
      }
    });
  });
});
