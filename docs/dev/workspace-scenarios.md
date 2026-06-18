# Workspace scenarios (dev only)

Repeatable, database-backed workspace states for redesigning and testing admin pages without depending on ad-hoc local data.

Scenarios are **not** a production feature. They do not add API endpoints and are blocked outside local development unless you explicitly opt in with `FEFEAVE_ALLOW_WORKSPACE_SCENARIO=1` on a disposable database branch.

## Quick start

```bash
# Ensure local DB is up and migrated
make dev-db-up dev-migrate

# Load a named scenario (clears prior scenario data, then inserts)
make dev-scenario SCENARIO=shows-typical-week

# List available scenarios
make dev-scenario-list

# Remove all scenario-tagged rows without loading a new scenario
make dev-scenario-reset
```

Open [http://localhost:3000/admin/shows](http://localhost:3000/admin/shows) with local dev auth bypass to verify.

`make dev-seed` remains the general-purpose Financials mock seed. Scenarios use a separate namespace (`[scenario-id]` show names and `(workspace-scenario)` vendor notes) so they can coexist until you run another scenario (which clears the scenario namespace first).

## Initial Shows scenarios

| Scenario                | What you should see on `/admin/shows`                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `shows-empty-week`      | **This Week** empty state; one past-week completed show; one next-week planned show |
| `shows-typical-week`    | One ACTIVE + one COMPLETED this week; one future PLANNED show                       |
| `shows-needs-close-out` | Two ACTIVE shows with large pending settlements (close-out / attention UI)          |
| `shows-busy-week`       | Seven shows across the current week (mixed statuses)                                |

All show dates are relative to the **current local ISO week** (Monday start) at run time — never hardcoded calendar dates:

| Offset             | Meaning                              | Example use                                                   |
| ------------------ | ------------------------------------ | ------------------------------------------------------------- |
| Week `0`, day 0–6  | Current workspace week               | `shows-typical-week` ACTIVE/COMPLETED rows                    |
| Week `-1`, day 0–6 | Previous week (`weekStart − 7 days`) | `shows-empty-week` archived show                              |
| Week `+1`, day 0–6 | Next week (`weekStart + 7 days`)     | `shows-empty-week` preview, `shows-typical-week` planned show |

Helpers live in `backend/src/dev/workspace-scenarios/scenario-dates.ts`. Tests in `workspace-scenario-dates.test.ts` assert dates stay in the correct week and advance when time moves forward.

## Safety

The runner enforces:

- `NODE_ENV=production` → hard block
- `FEFEAVE_WORKSPACE_SCENARIO_DISABLED=1` → hard block
- Non-localhost `DATABASE_URL` → block unless `FEFEAVE_ALLOW_WORKSPACE_SCENARIO=1`
- Host patterns for RDS, Neon, Supabase, etc. → block
- URL substrings `prod`, `production`, `staging` → block

## Architecture

```
backend/src/dev/workspace-scenarios/
  ids.ts                 # Canonical scenario id list (namespace cleanup uses this)
  registry.ts            # Names, descriptions, domains, runner functions
  safety.ts              # Environment guards
  run.ts                 # Transaction + backfill orchestration
  namespace-cleanup.ts   # Delete scenario-tagged rows (idempotent reset)
  shows-helpers.ts       # Shared insert helpers for Shows domain
  scenarios/             # One module per scenario runner
backend/scripts/run-workspace-scenario.ts   # CLI entry
```

Each run:

1. Asserts environment safety
2. Begins a transaction
3. Ensures dev user (`local@fefeave.local`)
4. Deletes all prior workspace-scenario data (shows, settlements, scenario vendors)
5. Runs the scenario `run()` function
6. Commits
7. Runs `financial_events` backfill (same as `make dev-seed`)

## Adding a new scenario

1. **Add the id** to `backend/src/dev/workspace-scenarios/ids.ts`:

   ```ts
   export const WORKSPACE_SCENARIO_IDS = [
     // ...
     "dashboard-quiet-week",
   ] as const;
   ```

2. **Create a runner** under `scenarios/`, e.g. `scenarios/dashboard-quiet-week.ts`:

   ```ts
   import type { WorkspaceScenarioContext } from "../types";

   export async function runDashboardQuietWeek(
     ctx: WorkspaceScenarioContext,
   ): Promise<void> {
     const { client, userId, formatYmd, addDays, weekStart } = ctx;
     // Insert domain rows via shared helpers; tag shows with scenarioShowName()
   }
   ```

3. **Register** in `registry.ts` with `id`, `description`, `domains`, and `run`.

4. **Tag data** so cleanup stays precise:
   - Shows: `scenarioShowName(scenarioId, 'Human label')` → `[scenario-id] Human label`
   - Vendors / notes: include `WORKSPACE_SCENARIO_MARKER` → `(workspace-scenario)`

5. **Add a test** in `workspace-scenarios.test.ts` if you extend `WORKSPACE_SCENARIO_IDS` (registry completeness is already asserted).

6. **Document** the expected UI in this file’s scenario table.

7. **Run locally**:

   ```bash
   make dev-scenario SCENARIO=dashboard-quiet-week
   ```

### Extending beyond Shows

Reuse `WorkspaceScenarioContext` date helpers and add domain-specific helper modules (e.g. `purchases-helpers.ts`) next to `shows-helpers.ts`. Keep runners thin; put shared insert logic in helpers that mirror patterns from `backend/scripts/seed-dev.ts`.

Do **not** add scenario data to React components or frontend mocks — scenarios must flow through the real API and database.

## Makefile targets

| Target                       | Description                   |
| ---------------------------- | ----------------------------- |
| `dev-scenario SCENARIO=<id>` | Load scenario                 |
| `dev-scenario-list`          | Print registry                |
| `dev-scenario-reset`         | Clear scenario namespace only |

## npm scripts

```bash
cd backend
npm run scenario:run -- shows-typical-week
npm run scenario:list
npm run scenario:reset
npm run test:scenarios
```

## Future UI toggle

If a dev UI switch is added later, gate it with the same checks as `assertWorkspaceScenarioEnvironmentSafe` and never ship scenario controls in production builds.
