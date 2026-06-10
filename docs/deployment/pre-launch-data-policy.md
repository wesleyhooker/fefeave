# Pre-launch data policy

This app is still in **development**. There are no production users relying on historical ledger data yet. Existing rows are **dev, seed, or mock data** unless you explicitly treat an environment as real.

## Default stance

| Environment                          | Policy                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Local / dev**                      | Reset freely. `make dev-reset` or `npm run db:reset` drops schema, migrates, and re-seeds.            |
| **Shared dev / staging (mock)**      | Prefer **reset + migrate + seed** over historical repair.                                             |
| **First real prod (Felicia launch)** | Start from **clean migrated DB + seed only if needed**, or reset Neon if it only ever held test data. |

**Do not** spend launch runway reconciling mock-era payment drift unless you are **preserving** an environment that already has real financial activity.

## Financial event backfill

`npm run backfill:financial-events` inserts missing **RECORDED** events for domain rows that predate dual-write.

| Situation                    | Action                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| Fresh DB after reset/migrate | Usually **not needed** — new writes emit events at create time. |
| Old dev DB you want to keep  | Run backfill, then optional `reconcile:payment-drift --report`. |
| Real prod with legacy rows   | Backfill + drift report before trusting balances.               |

## Payment drift tooling

`npm run reconcile:payment-drift` (report / dry-run / reconcile) remains available for **optional** cleanup of pre-fix PATCH/DELETE gaps.

- **Launch-critical:** new payment writes stay aligned (see `vendor-payment-write-trust-integration.test.ts` and CI critical suites).
- **Not launch-critical for dev:** repairing seed/mock drift before Dashboard or UX work.

## Launch trust checklist (real prod only)

When an environment first holds **real** money movement:

1. `npm run verify:migrations`
2. Optional: `backfill:financial-events` if migrating legacy rows
3. Optional: `reconcile:payment-drift --report` (reconcile only if drift > 0)
4. Record a **cash snapshot** in Business Health
5. Confirm `AUTH_MODE=cognito`, `FINANCIAL_RECOMMENDATIONS_SOURCE=events`

For **dev/mock** environments: skip steps 2–3; reset instead.

## Related docs

- [deploy-checklist.md](deploy-checklist.md) — operator deploy sequence
- [prod-release.md](prod-release.md) — infra and Cognito bootstrap
