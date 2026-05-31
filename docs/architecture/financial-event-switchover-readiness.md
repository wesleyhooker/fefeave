# Financial Event Switchover Readiness Report

**Branch:** `feat/financial-events-switchover-readiness`  
**Date:** 2026-05-30  
**Scope:** Readiness pass + **recommendation switchover** (not full source-of-truth promotion).

## Summary

This branch resolves documented blockers and switches production recommendation cash
math to the event-derived projection by default. Overview allocation UI, Activity,
and domain tables are unchanged.

| Blocker                                        | Status                                             |
| ---------------------------------------------- | -------------------------------------------------- |
| Show payout completion context (`show_status`) | **Resolved**                                       |
| Owner activity correction / void events        | **Resolved**                                       |
| Settlement dual-write coverage (show-linked)   | **Resolved**                                       |
| Projection parity suite                        | **Clean** (18 parity cases + dual-write tests)     |
| Recommendation switchover                      | **Complete** (default `events`, rollback `tables`) |

## Recommendation switchover (implemented)

**Default:** `FINANCIAL_RECOMMENDATIONS_SOURCE=events`

- `GET /financial-recommendations` loads post-snapshot cash via
  `loadRecommendationCashEventTotals` → `loadCashEventTotalsFromEvents`.
- Snapshot anchor still from `cash_snapshots` (no-snapshot → unavailable unchanged).
- **Rollback:** set `FINANCIAL_RECOMMENDATIONS_SOURCE=tables` to use
  `loadCashEventTotals` (table-derived path preserved).

**Not in scope (Phases 6–7):**

- Promoting all Financials read models to event-sourced projections.
- Removing domain tables or table-derived cash code.
- Changing Activity, Allocation Plan UI, or Overview non-recommendation paths.

## Pre-switchover readiness (resolved)

### Show payout completion context

- `emitShowPayoutRecorded` includes `show_status` in payload.
- `PATCH /shows/:id` emits `SHOW_PAYOUT_UPDATED` with current payout + status when
  financials exist (covers close/reopen).
- Backfill includes `show_status` from the joined `shows` row for **new**
  `SHOW_PAYOUT_RECORDED` rows only (skips shows that already have that event).

### Owner correction / void

New event types:

- `OWNER_DRAW_CORRECTED` / `OWNER_SELF_PAY_CORRECTED`
- `OWNER_DRAW_VOIDED` / `OWNER_SELF_PAY_VOIDED`

Event-derived cash uses latest event per `owner_self_pay` source and excludes voided.

### Settlement coverage audit

| Path                                            | Event                | Cash impact     |
| ----------------------------------------------- | -------------------- | --------------- |
| `POST /shows/:showId/owed-line-items`           | `SETTLEMENT_CREATED` | Neutral         |
| `POST /shows/:showId/settlements` (all methods) | `SETTLEMENT_CREATED` | Neutral         |
| `DELETE /shows/:showId/settlements/:id`         | `SETTLEMENT_VOIDED`  | Neutral (audit) |

**Not covered:** vendor expense obligations (`vendor-expenses.ts`); seed/migrations.

## Remaining known gaps

| Gap                                                    | Impact                                                           | Mitigation                                                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Legacy `SHOW_PAYOUT_*` without completion context      | Event-derived recommendations under-count completed-show inflows | Targeted repair/migration (see § Deployment notes); or `FINANCIAL_RECOMMENDATIONS_SOURCE=tables` until repaired |
| Pre-readiness owner edits (no CORRECTED/VOIDED events) | Drift vs table for historical corrections                        | Backfill emits current active rows only; live dual-write now correct going forward                              |
| Vendor expense obligation writes                       | Activity timeline only                                           | Future work                                                                                                     |
| `SETTLEMENT_ADJUSTED` on amount edits                  | None for current cash math                                       | Future if edits become cash-moving                                                                              |

## Parity status

- **Snapshot anchor:** Table anchor for recommendations; event anchor parity tested separately.
- **Cash totals:** Parity + recommendation integration tests assert table vs event equivalence on fresh dual-write data.
- **Internal smoke:** `assertRecommendationCashSourcesParity` (tests only, no public endpoint).

## Deployment notes

Existing ledgers with `SHOW_PAYOUT_*` events created before `show_status` support may
require a targeted repair/migration before recommendation parity is guaranteed.

**Why re-run backfill alone is not enough:** `backfill-financial-events` skips a show
when `SHOW_PAYOUT_RECORDED` already exists. It does not update payloads on existing
events or emit `SHOW_PAYOUT_UPDATED` completion snapshots for shows that were already
closed before this branch shipped.

**Recommended deploy sequence:**

1. Deploy to staging with default `FINANCIAL_RECOMMENDATIONS_SOURCE=events`.
2. Compare staging recommendations against table rollback (`tables`) or known-good totals.
3. If completed-show inflows diverge, run a targeted repair (e.g. append
   `SHOW_PAYOUT_UPDATED` with `show_status: COMPLETED` for completed shows missing
   completion context) or keep `FINANCIAL_RECOMMENDATIONS_SOURCE=tables` until repair
   completes.
4. For greenfield or fully backfilled ledgers (no pre-status payout events), event
   source is parity-safe without extra migration.

**Rollback:** set `FINANCIAL_RECOMMENDATIONS_SOURCE=tables` on the backend container/Lambda
env and redeploy. No schema change required.

## Validation

```bash
cd backend && npm run build
cd backend && npm test
cd backend && npm run test:integration
```

## Files touched (switchover extension)

- `backend/src/config/env.ts` — `FINANCIAL_RECOMMENDATIONS_SOURCE`
- `backend/src/services/recommendation-cash-totals.ts` — source dispatch + parity helper
- `backend/src/routes/financial-recommendations.ts` — wired to event-derived default
- `backend/src/__tests__/recommendation-cash-totals.test.ts`
- `backend/src/__tests__/financial-recommendations-integration.test.ts`
- `backend/.env.example`
- `docs/architecture/financial-event-sourcing.md`
- `docs/architecture/financial-event-switchover-readiness.md` (this report)

## Merge recommendation

**Ready to merge** after CI green. Before production cutover, validate staging parity or
plan targeted `show_status` repair; use `FINANCIAL_RECOMMENDATIONS_SOURCE=tables` as
immediate rollback if needed.
