# FefeAve — Event-First Financials Architecture

Status: Finalized for implementation (planning only — no code, migrations, or API changes in this document)
Last Updated: 2026-05-30
Scope: Technical/product architecture for making the **Financials** domain event-first.

Related:

- [`docs/product/financial-decision-center-plan.md`](../product/financial-decision-center-plan.md)
- [`docs/product/financials-vision-v2.md`](../product/financials-vision-v2.md)

> This document is a plan. It does **not** introduce code, migrations, route
> changes, or API changes. It defines the target architecture and a phased,
> low-risk path to get there.

**Terminology (read this first):**

- **Financials should become event-first long term.** The durable goal is a
  true event-sourced Financials domain: an append-only event log as source of
  truth, with current state derived from events and projections.
- **The hybrid event ledger is the first implementation phase, not the final
  architectural destination.** Dual-writing events alongside existing domain
  rows is a safe migration bridge — not a substitute for event-first, and not
  something we pretend is the end state.
- **We are not event-sourcing the whole app.** Auth, users, public pages, and
  non-financial configuration stay ordinary CRUD unless they directly affect
  financial recommendations.
- **We are only targeting the Financials domain** (and show/settlement paths
  where they affect financial state).

---

## 0. Boundaries — where event-first applies

Event-first is a **Financials-domain** decision, not an app-wide one.

**Event-first applies to:**

- Financials
- Shows **only where they affect financial state** (e.g. recorded show payout / show financials)
- Inventory purchases
- Business expenses
- Wholesaler payments
- Owner activity / owner draws / self-pay
- Cash snapshots
- Strategy changes
- Show payouts / show financials
- Settlements / obligations (`owed_line_items`)

**Event-first does NOT apply to:**

- Auth
- Users
- Static public pages
- UI-only state
- Non-financial admin configuration (unless it impacts financial recommendations)

The line is simple: **if it moves cash, changes an obligation, or changes a
strategy-affecting decision, it is a financial event.** Everything else stays as
ordinary CRUD.

---

## 1. Why event-first for Financials?

Financials is already naturally event-like. The real-world activity Felicia
performs is a stream of discrete, timestamped facts:

- a show payout is recorded
- a settlement (obligation) is created
- a wholesaler payment is made
- inventory is purchased
- a business expense is recorded
- an owner draw / self-pay is recorded
- a cash snapshot is reconciled
- a strategy is changed

Each of these is a _thing that happened at a point in time_ with an amount, a
direction, and an actor. That is the definition of an event.

Today these facts live in separate domain tables (`payments`,
`inventory_purchases`, `business_expenses`, `owner_self_pay_transactions`,
`cash_snapshots`, `financial_strategy_settings`, `show_financials`,
`owed_line_items`). The Recommendation Engine already _reconstructs_ an event
stream at query time — see `loadCashEventTotals()` in
`backend/src/services/event-adjusted-cash.ts`, which `UNION`s five tables to
compute inflows and outflows since the last snapshot. That is event-sourcing by
hand, without a ledger.

A first-class event ledger gives us:

- **Central history** — one ordered timeline of everything financial, instead of
  five separate queries joined at read time.
- **Audit trail** — who did what, when, and why; corrections preserved rather
  than overwritten.
- **Explainability** — answer _"why did my safe owner draw change?"_ by replaying
  the events between two points in time.
- **Future AI/recommendation context** — a clean, typed event stream is the
  ideal input for V2 smart explanations and V3 recommendations (see Decision
  Center plan §5) without scraping UI tables.
- **Rebuildable read models** — the ability to recompute event-adjusted cash,
  activity feeds, and projections from the ledger later, instead of being locked
  to the current table shapes.

This aligns directly with the Vision V2 _Data Collection Philosophy_: "Storage
is cheap. Missing historical data is expensive." An event ledger is the cheapest
way to stop losing financial history we cannot reconstruct later.

---

## 2. Definitions: event-driven vs event-sourced vs hybrid

These terms get conflated. We use them precisely in this doc.

### Event-driven

Components communicate by **emitting and reacting to events** (often via a queue
or bus). The event is a _notification_; the domain tables remain the source of
truth. Useful for decoupling side effects (e.g. "send a reminder when a snapshot
goes stale").

> We are **not** proposing an event bus or queues now. That is a later option,
> only if needed (see §15).

### Event-sourced

The **event log is the source of truth.** Current state is _derived_ by replaying
events into projections (read models). Domain tables, if they exist, are
disposable caches that can be rebuilt from the log. Strong audit and
explainability, but a larger commitment: every write must go through the log, and
projections must be maintained.

### Hybrid event ledger (near-term implementation path)

An **append-only `financial_events` ledger runs alongside existing domain
tables.** During migration, domain tables remain operational while we also write
events — typically in the same transaction as the domain row.

The hybrid ledger is **how we get there**, not **where we stop**. It captures
audit and explainability value now, validates event vocabulary on real writes,
and keeps current routes and pages working while we move toward event-sourced
Financials.

See §4 (Pure Event-Sourced Target vs Hybrid Migration Path) and §12
(Implementation phases) for the full phased plan.

---

## 3. Source-of-truth decision

This is the most important decision in the document, so it is stated explicitly.

### Long-term desired direction

`financial_events` should **eventually become the source of truth** for:

- **Financial movements** — cash inflows and outflows (payouts, payments,
  inventory, expenses, owner draws/self-pay).
- **Cash-impacting actions** — including reconciliation anchors
  (`CASH_SNAPSHOT_RECORDED`).
- **Strategy-affecting decisions** — strategy preset and lever changes.
- **Obligation events** — settlement creation and adjustment (even when
  `NEUTRAL` for cash, they belong in financial history).

Cash position, activity history, and recommendation explanations are **derived
from the ledger** (or from projections rebuilt from it).

Existing financial domain tables (`payments`, `inventory_purchases`,
`business_expenses`, `owner_self_pay_transactions`, `cash_snapshots`,
`financial_strategy_settings`, `show_financials`, `owed_line_items`) **may
eventually become read models or projections** where that simplifies reads or
rebuild logic. This does **not** need to happen all at once — table by table, as
each projection proves useful.

### Near-term safe path

- Existing domain tables **stay operational during migration.** Routes, APIs, and
  UI continue to read and write them as today.
- This **avoids rewriting the whole Financials domain** before the event language
  (types, payloads, correction patterns) is proven on real data.
- **Dual-writing is transitional, not necessarily permanent.** Phase 2 writes an
  event alongside each domain row in the same transaction so history is complete
  while we validate projections. Once event-derived read models are trusted, we
  can reduce or remove dependence on dual-write — not because hybrid was wrong,
  but because the ledger has earned source-of-truth status.
- New financial writes should **append an event within the same database
  transaction** as the domain row write so the two never drift during the hybrid
  period.
- Reads continue to use domain tables until event-derived projections are proven
  equal or better.

### Why this framing

- It **names the destination** (event-sourced Financials) while **honoring the
  bridge** (hybrid ledger). Hybrid is not fake or wrong — it is the safe path to
  the same future.
- It **avoids a risky big-bang rewrite** before we have written a single line of
  ledger code or validated event types against Felicia's workflows.
- It **leaves the path fully open**: because every financial write also lands in
  the ledger from Phase 2 onward, we can build projections and promote the log
  to source of truth without a scramble.
- It matches the Decision Center plan: the Recommendation Engine is an
  **advisor that never moves money** — the ledger records what happened; it does
  not take actions on its own.

### Why not full rewrite now?

- **Existing CRUD and read models already work** — payments, expenses, inventory,
  owner activity, snapshots, and recommendations are live; a full rewrite would
  stall product progress for uncertain gain.
- **User-facing Financials is still evolving** — Overview, allocation plan, and
  strategy UX are active; locking every table into projections before the event
  vocabulary settles risks rework.
- **Event vocabulary should be validated first** — types, payloads, and correction
  patterns need real dual-writes and backfill before every table becomes a
  projection.
- **The hybrid path gives the same long-term direction with less risk** — central
  history, audit, and explainability now; source-of-truth flip when projections
  earn it.

---

## 4. Pure Event-Sourced Target vs Hybrid Migration Path

### Pure event-sourced target (long-term)

This is where Financials is headed:

- **Events are the permanent truth** — `financial_events` is append-only; nothing
  financial is "fixed" by deleting or overwriting history.
- **Current state is derived** — balances, cash estimates, activity feeds, and
  recommendation inputs come from replaying events into projections (read models).
- **Corrections are append-only events** — `*_CORRECTED` / `*_VOIDED` with
  `causation_id`; no silent edits to past facts.
- **Read models can be rebuilt** — if a projection bug is found, replay the log
  and rebuild; domain tables that become projections are disposable caches, not
  authoritative history.

We are **not** committing to rewrite every table on day one. Some tables (e.g.
operational `shows`, current-state `financial_strategy_settings`) may always stay
as hybrid companions to the log. The target is **event-first Financials**, not
**event-only everything**.

### Hybrid migration path (near-term)

How we get from today's CRUD tables to the target:

- **Write event rows alongside existing domain rows** — same transaction, same
  user action; `source_type` / `source_id` link back for reconciliation.
- **Keep current routes and pages working** — no forced UI or API migration in
  early phases.
- **Backfill existing rows into events** — so the ledger has full history before
  we depend on it for reads.
- **Gradually move projections, recommendations, and Activity to events** —
  parallel-run and assert equality before switchover (see §10).

Dual-write is **transitional engineering**, not an admission that event sourcing
failed. It is how we validate the event language while shipping value.

### Why we choose this path

- **Central history now** — one timeline instead of five-table UNIONs at read time.
- **Avoids a risky rewrite** — no big-bang replacement of working financial CRUD.
- **Validates event language before sole truth** — types and payloads prove out on
  real writes before we remove table authority.
- **Keeps the door open to true event sourcing** — when projections match tables,
  promoting the log to source of truth is a deliberate phase, not a leap of faith.

---

## 5. What "event-first" means for FefeAve Financials

Principles for the Financials domain (not the whole app):

1. **Every financial fact should eventually be represented as an immutable
   event** — what happened, when, with what amount and direction.
2. **Events describe what happened, not what we recommend** — recording an expense
   is an event; "set aside $2,550 for taxes" is a derived recommendation, not an
   event.
3. **Recommendations are derived from events; recommendations are not events** —
   the Recommendation Engine reads projections built from facts, never writes
   ledger rows for suggestions.
4. **Domain tables can remain as read models** — especially during hybrid phases;
   long-term, selected tables may be pure projections rebuilt from the log.
5. **New financial write paths should be designed around event creation** — even
   while dual-writing, the mental model is "append a fact to the ledger" plus
   "update the operational row."
6. **Financial history should be append-only** — no mutating or deleting past
   `financial_events` rows to fix mistakes.
7. **Corrections should create correction/void events, not erase history** —
   `*_CORRECTED` / `*_VOIDED` preserve the story (see §8).
8. **UI pages should eventually read from event-derived projections when useful**
   — Activity, cash adjustment summaries, and explanation panels are natural
   consumers; operational CRUD pages may keep using domain tables until a
   projection is clearly better.

Event-first applies **only to Financials** (and financial slices of Shows). Auth,
users, and static content stay out of scope.

---

## 6. Proposed `financial_events` table

Implemented shape (Phase 1 migration `1780045000000_financial_events.js`).
Conventions follow the existing schema: `uuid` PKs via `gen_random_uuid()`,
`numeric(19,4)` money, `timestamptz` timestamps, `jsonb` for flexible payloads.

```text
financial_events
- id                uuid         primary key   default gen_random_uuid()
- event_type        text         not null
- event_category    text         not null      -- derived from event_type; see field notes
- occurred_at       timestamptz  not null      -- when the system recorded the event
- effective_date    date         null          -- business/cash date (e.g. expense_date)
- amount            numeric(19,4) null
- currency          text         not null       default 'USD'
- direction         text         null           -- 'INFLOW' | 'OUTFLOW' | 'NEUTRAL'
- source_type       text         null           -- domain table/concept (e.g. 'business_expense')
- source_id         uuid         null           -- row id in the source table
- actor_user_id     text         null           -- actor identifier; not a FK (see field notes)
- correlation_id    uuid         null            -- groups related events (one user action)
- causation_id      uuid         null            -- the event/command that caused this one
- event_version     integer      not null        default 1      -- schema version per event_type
- idempotency_key   text         null            -- dedupe dual-writes / retries (partial unique index)
- payload           jsonb        not null        default '{}'   -- event-specific detail
- metadata          jsonb        not null        default '{}'   -- request/context info
- created_at        timestamptz  not null        default now()
```

### Field notes

- **`event_category`** — domain area (`FINANCIAL`, `INVENTORY`, `PAYMENT`, `OWNER`,
  `STRATEGY`, `SETTLEMENT`, `SHOW`, `SYSTEM`). **Derived from `event_type` by
  `appendFinancialEvent`** using the type catalog (`FINANCIAL_EVENT_TYPE_META`);
  callers must not pass it directly, so category cannot drift from type.
- **`occurred_at` vs `effective_date`** — `occurred_at` is _when we recorded it_
  (system time, always present). `effective_date` is the _business date that
  matters for cash math_ (e.g. an expense dated last week, entered today). The
  current cash logic keys off transaction dates (`expense_date`, `payment_date`,
  `purchase_date`, `paid_at::date`, `show_date`), so `effective_date` is what
  projections will filter on.
- **`direction`** — drives cash math directly. `INFLOW` increases estimated cash,
  `OUTFLOW` decreases it, `NEUTRAL` is recorded for audit/history but does not
  move cash (e.g. settlement creation, strategy change).
- **`amount` nullable** — strategy-change events carry no amount. Keep it nullable
  rather than forcing `0`, so "no amount" and "$0" stay distinguishable.
- **`source_type` / `source_id`** — back-pointer to the domain row in the hybrid
  phase. Lets us reconcile ledger vs table and backfill safely.
- **`actor_user_id`** — `text`, not `uuid`. dev_bypass and Cognito actor
  identifiers are not guaranteed UUIDs (e.g. `local-dev-user`). Events outlive
  users; no FK to `users`.
- **`idempotency_key`** — unique when present (partial unique index); the safety
  requests. Recommended construction: `"<source_type>:<source_id>:<event_type>"`
  (plus a correction sequence suffix for correction events).
- **`payload`** — full typed snapshot of the event-specific data (e.g. category,
  notes, week range). Self-describing so projections never need to re-read the
  domain table.
- **`metadata`** — request context (created_via, route, client) kept separate
  from business `payload`. Never store secrets/tokens here.

### Recommendation on the optional fields

| Field                       | Include now?                     | Rationale                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `business_id` / `tenant_id` | **No, but reserve the concept**  | FefeAve is single-business today (`financial_strategy_settings.scope_key = 'global'`). Adding a tenant column now is speculative. Document the seam (a future migration adds `business_id` with a backfilled default) so it is cheap to add. |
| `correlation_id`            | **Yes**                          | Cheap and high-value: groups all events from one user action (e.g. a batch payment touching several obligations) for the Activity timeline.                                                                                                  |
| `causation_id`              | **Yes (nullable, lightly used)** | Essential for correction chains (a `*_CORRECTED` event points at the original). Nearly free to include now; painful to retrofit meaning later.                                                                                               |
| `event_version`             | **Yes**                          | Per-`event_type` schema version. Costs one integer; saves us when a payload shape evolves (see §15). Default `1`.                                                                                                                            |

So: include `correlation_id`, `causation_id`, and `event_version` from day one;
defer `business_id`/`tenant_id` but keep the design tenant-ready.

### Indexing (Phase 1 migration)

- `(effective_date)` and/or `(occurred_at)` — time-window projection queries.
- `(source_type, source_id)` — reconciliation and backfill.
- `(event_type)` — filtered activity views.
- `(event_category)` — filter by domain area (Activity, analytics) without a
  type→category lookup at read time.
- `(correlation_id)` — grouping a single user action.
- unique `(idempotency_key)` where not null — dedupe (partial unique index).

---

## 7. Event types

Initial catalog. Direction is from the **business cash** perspective.

> "Affects cash" = participates in event-adjusted estimated current cash.
> "Affects recs" = changes Recommendation Engine output (directly via cash, or by
> changing the strategy levers).

| Event type                    | Trigger                                       | Direction                       | Amount meaning                                           | Source table                      | Affects cash                                | Affects recs                          |
| ----------------------------- | --------------------------------------------- | ------------------------------- | -------------------------------------------------------- | --------------------------------- | ------------------------------------------- | ------------------------------------- |
| `SHOW_PAYOUT_RECORDED`        | Show financials recorded for a completed show | INFLOW                          | `payout_after_fees_amount` (net of platform fees)        | `show_financials`                 | Yes (when show `COMPLETED`)                 | Yes                                   |
| `SHOW_PAYOUT_UPDATED`         | Existing show financials edited               | INFLOW (delta or restated)      | New net payout (carry prior in payload)                  | `show_financials`                 | Yes                                         | Yes                                   |
| `SETTLEMENT_CREATED`          | Obligation/owed line item created             | NEUTRAL                         | Amount owed (not a cash movement)                        | `owed_line_items`                 | No                                          | Indirect (future obligations context) |
| `SETTLEMENT_ADJUSTED`         | Obligation amount/status adjusted             | NEUTRAL                         | Adjusted amount                                          | `owed_line_items` / `adjustments` | No                                          | Indirect                              |
| `WHOLESALER_PAYMENT_RECORDED` | Payment to a wholesaler recorded              | OUTFLOW                         | `payments.amount`                                        | `payments`                        | Yes                                         | Yes                                   |
| `INVENTORY_PURCHASE_RECORDED` | Inventory purchase recorded                   | OUTFLOW                         | `inventory_purchases.amount`                             | `inventory_purchases`             | Yes                                         | Yes                                   |
| `BUSINESS_EXPENSE_RECORDED`   | Business expense recorded                     | OUTFLOW                         | `business_expenses.amount`                               | `business_expenses`               | Yes                                         | Yes                                   |
| `OWNER_DRAW_RECORDED`         | Owner draw recorded                           | OUTFLOW                         | `owner_self_pay_transactions.amount` (type `OWNER_DRAW`) | `owner_self_pay_transactions`     | Yes                                         | Yes                                   |
| `OWNER_SELF_PAY_RECORDED`     | Owner self-pay recorded                       | OUTFLOW                         | `owner_self_pay_transactions.amount` (type `SELF_PAY`)   | `owner_self_pay_transactions`     | Yes                                         | Yes                                   |
| `CASH_SNAPSHOT_RECORDED`      | Cash reconciliation snapshot saved            | NEUTRAL (reconciliation anchor) | Reconciled cash on hand                                  | `cash_snapshots`                  | Resets the baseline (not an inflow/outflow) | Yes (new anchor + confidence)         |
| `FINANCIAL_STRATEGY_CHANGED`  | Strategy preset/levers changed                | NEUTRAL                         | none (`amount` null)                                     | `financial_strategy_settings`     | No                                          | Yes (changes levers)                  |

Notes:

- **Platform fees are not events.** Payouts are already recorded net of fees
  (`show_financials.payout_after_fees_amount`). This matches the current
  Decision Center model and `event-adjusted-cash.ts`.
- **`CASH_SNAPSHOT_RECORDED` is a reset, not a flow.** It re-anchors the cash
  estimate; projections treat it as a new baseline rather than summing it as an
  inflow.
- Owner draw vs self-pay are separate event types (they map to the
  `owner_self_pay_transaction_type` enum) so activity and analytics can
  distinguish them, even though both are cash outflows.

Event type names should live in a single shared constants module (TS) so backend
writers and any future consumers agree on spelling.

**Phase 1 catalog:** the table above lists initial `*_RECORDED` and change events
only. `*_CORRECTED` and `*_VOIDED` types are **deferred to Phase 2** — they ship
with dual-writes and correction paths so the catalog stays consistent (see §8).

---

## 8. Corrections and updates

The ledger is **append-only**. We never mutate or delete past events to fix a
mistake. Corrections are themselves new events.

**Phase 1:** correction/void event types are not in the catalog yet; Phase 1
defines the append path and initial types only. **Phase 2** introduces
`*_CORRECTED` / `*_VOIDED` types and emits them when domain rows are edited or
voided (§12).

Pattern per corrigible concept (Phase 2+):

```text
BUSINESS_EXPENSE_RECORDED      -- original fact
BUSINESS_EXPENSE_CORRECTED     -- restates amount/fields; causation_id -> original
BUSINESS_EXPENSE_VOIDED        -- reverses the original; causation_id -> original
```

Apply the same shape to the other movement events as needed
(`WHOLESALER_PAYMENT_VOIDED`, `INVENTORY_PURCHASE_CORRECTED`,
`OWNER_DRAW_VOIDED`, etc.). Conventions:

- **Correction events carry the delta or the full restated value in `payload`**,
  plus a reference to what changed and why (`reason`). Keep enough to replay
  without reading the domain table.
- **`causation_id` links the correction to the original event** so the Activity
  page and explanations can show "this $120 expense was later corrected to $95."
- **Voids reverse cash impact** by emitting an opposing/neutralizing event rather
  than editing the original. The original stays in history as intent.

### V1 reality check

In V1 the **domain tables may still update in place** (e.g. editing an expense
row, soft-deleting via `deleted_at`, voiding via `voided_at` on owner self-pay).
That is acceptable during the hybrid phase. The rule is: **the event history must
preserve intent** — when a domain row is edited or voided, emit the matching
`*_CORRECTED` / `*_VOIDED` event so the ledger still tells the true story even if
the table only shows the latest state.

This is exactly why dual-writing in the same transaction (§3, §12) matters: a
table edit without its correction event would silently desync history.

---

## 9. Relationship to existing tables

Current financial tables and how they map to the event model. "Read model later?"
means: could this table eventually be rebuilt as a projection of the ledger.

| Table (today)                 | Future event type(s)                                      | Becomes a read model/projection later?              | Add `event_id` / source mapping?                             |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `shows`                       | (none directly — operational)                             | No (operational entity, not purely financial)       | No; referenced via `show_financials`                         |
| `show_financials`             | `SHOW_PAYOUT_RECORDED`, `SHOW_PAYOUT_UPDATED`             | Possibly (payout history is a natural projection)   | Map via `source_type='show_financials'`, `source_id=show_id` |
| `owed_line_items`             | `SETTLEMENT_CREATED`, `SETTLEMENT_ADJUSTED`               | Partially (obligation/balance projection candidate) | `source_type='owed_line_item'`, `source_id=id`               |
| `payments`                    | `WHOLESALER_PAYMENT_RECORDED` (+ void/correct)            | Possibly                                            | `source_type='payment'`, `source_id=id`                      |
| `inventory_purchases`         | `INVENTORY_PURCHASE_RECORDED` (+ correct/void)            | Likely (spend history projection)                   | `source_type='inventory_purchase'`, `source_id=id`           |
| `business_expenses`           | `BUSINESS_EXPENSE_RECORDED` (+ correct/void)              | Likely                                              | `source_type='business_expense'`, `source_id=id`             |
| `owner_self_pay_transactions` | `OWNER_DRAW_RECORDED`, `OWNER_SELF_PAY_RECORDED` (+ void) | Possibly                                            | `source_type='owner_self_pay'`, `source_id=id`               |
| `cash_snapshots`              | `CASH_SNAPSHOT_RECORDED`                                  | No (anchor records; keep as-is)                     | `source_type='cash_snapshot'`, `source_id=id`                |
| `financial_strategy_settings` | `FINANCIAL_STRATEGY_CHANGED`                              | No (current-state config; ledger logs changes)      | `source_type='financial_strategy'`, `source_id=id`           |

General guidance:

- We do **not** add an `event_id` column to the domain tables in the hybrid phase.
  The mapping lives on the **event** (`source_type` + `source_id`), which keeps the
  domain tables untouched and lets one domain row have many events
  (created → corrected → voided).
- `cash_snapshots` and `financial_strategy_settings` stay as current-state tables;
  the ledger records the _changes_ to them, not a replacement for them.

---

## 10. Recommendation engine impact

The Recommendation Engine today reconstructs cash flow by `UNION`-ing five tables
at query time (`loadCashEventTotals`). Event-first improves this in four ways:

- **Event-adjusted cash** — instead of querying five tables, sum ledger
  `INFLOW`/`OUTFLOW` events with `effective_date > snapshot_date`. One source,
  one query, consistent direction semantics. (The cash anchor remains
  `CASH_SNAPSHOT_RECORDED`.)
- **Recommendation explanations** — the formula breakdown already on Overview can
  cite the _actual events_ behind each number, not just totals.
- **"Why did my safe owner draw change?"** — replay the events between the
  previous view and now: "+$2,000 show payout on the 12th, −$300 expense on the
  14th, strategy changed from Balanced to Income Focused on the 15th." This is the
  marquee payoff and is impossible to answer cleanly from mutable tables.
- **Future AI context** — V2 smart explanations and V3 recommendations consume a
  typed event stream (see Decision Center §5) rather than scraping UI tables.

Clarifications:

- The Recommendation Engine **should not depend directly on UI/domain tables
  forever.** Long-term it consumes **event-derived projections** (or the ledger
  directly), so changes to a UI table's shape never silently break cash math.
- The engine stays an **advisor**: it reads events, it never writes them and never
  moves money. Recording an owner draw is a user action that emits an event;
  recommending one is not.

Migration approach: build the event-derived cash calculation **in parallel** and
assert it equals the current `loadCashEventTotals` output (regression test on the
same data) before switching the engine over. No behavior change until they match.

---

## 11. Financial Activity page (future — do not implement yet)

Location: **Financials → Activity**

Purpose:

- A **central, chronological timeline** of every financial event.
- Answers _"what happened financially?"_ in one place, across shows, payments,
  inventory, expenses, owner activity, snapshots, and strategy changes.
- Explains _why numbers changed_ by showing the events between two points in time,
  including corrections and voids (via `causation_id` chains).

Shape (sketch only):

- Reverse-chronological feed grouped by `effective_date`, each row showing
  event type, direction (inflow/outflow/neutral), amount, actor, and a
  human-readable summary from `payload`.
- Filters by event type and date range; correlation grouping so a batch action
  reads as one entry that expands.

This page is the natural first **consumer** of the ledger and the best
justification for building it — but it is **explicitly out of scope for now.**

---

## 12. Implementation phases

Phased so each step delivers value and nothing breaks. The hybrid phases (1–3)
are the **migration bridge**; phases 4–7 describe **consumers and promotion**
toward event-sourced Financials. **No code in this doc** — this is the plan
implementation branches will follow.

We do **not** imply an immediate rewrite of every table. Hybrid dual-write is
valid, intentional, and the safe path to the event-sourced target.

### Phase 1 — Event ledger foundation

**Status: implemented** (`feat/financial-events-foundation`).

- Add `financial_events` table (migration `1780045000000_financial_events.js`).
- Table includes `event_category` (writer-derived from `event_type`) and
  `actor_user_id` as `text` (not `uuid`).
- Add an event-writer helper/service (typed `appendFinancialEvent(...)`).
- Add event-type constants and payload types (shared module) — initial catalog
  only; correction/void types deferred to Phase 2.
- **No UI change. No behavior change. No existing route touched.**

### Phase 2 — Dual-write events alongside financial actions

Write the matching event **in the same transaction** as each new financial write:

- business expenses
- inventory purchases
- wholesaler payments
- owner activity (draws / self-pay)
- cash snapshots
- strategy changes
- show payouts (`show_financials`)

Include correction/void events when a domain row is edited or voided (§8).

Dual-write is **transitional** — it builds complete history while domain tables
remain authoritative for reads.

**Status: implemented** (dual-write on create/upsert paths; correction/void events
partially deferred — see follow-ups below).

#### Phase 2 follow-ups (known gaps)

**Owner self-pay upsert/void vs `financial_events` (drift risk)**

`PUT /owner-self-pay/:weekStart` uses `INSERT ... ON CONFLICT (account_id,
week_start_date) DO UPDATE`. Re-marking a week paid updates the existing
`owner_self_pay_transactions` row in place (same `id`; `amount`, `paid_at`,
`transaction_type`, etc. may change). Phase 2 emits `OWNER_DRAW_RECORDED` or
`OWNER_SELF_PAY_RECORDED` with idempotency key
`owner_self_pay:<id>:<event_type>` and **no version suffix**.

On a re-upsert, `appendFinancialEvent` sees the same key and returns
`created: false` — **no new event is appended**. The ledger keeps the first
recorded amount and payload while the domain row reflects the latest state.

Similarly, `DELETE /owner-self-pay/:weekStart` sets `voided_at` but does **not**
emit `OWNER_DRAW_VOIDED` / `OWNER_SELF_PAY_VOIDED` (void types not wired in
Phase 2 scope).

Drift can occur when:

1. A week is paid, then paid again after underlying completed-show payouts
   change (recomputed `amount` differs).
2. A voided week is revived via `PUT` (domain row active again; ledger still
   shows only the original `*_RECORDED` event, or nothing if void were later
   wired without a matching revive event).
3. A week is voided via `DELETE` (domain row has `voided_at`; ledger still
   counts the outflow from `*_RECORDED`).

**Impact:** Low for current hybrid reads (Overview and recommendations still use
`owner_self_pay_transactions`, not events). **Blocks** owner-activity promotion
(§13) and any event-derived owner outflow totals until resolved.

**Recommended fix (future branch):**

- On upsert, detect an existing non-void row with material field changes and emit
  `OWNER_*_CORRECTED` (or append a new `*_RECORDED` with `updated_at` suffix —
  mirror `SHOW_PAYOUT_UPDATED` / `FINANCIAL_STRATEGY_CHANGED`).
- On void (`DELETE`), emit `OWNER_*_VOIDED` with `causation_id` → original
  `*_RECORDED` event (§8).
- Add integration tests: re-upsert changes amount → ledger reflects correction;
  void → net outflow zero in event replay.

### Phase 3 — Backfill existing financial rows into events

- Generate historical events from existing financial rows so the ledger has full
  history.
- **Low risk:** production financial data is minimal/nonexistent today, so the
  backfill is small and easy to verify against table totals.
- Use deterministic `idempotency_key`s so the backfill is safely re-runnable.

### Phase 4 — Financial Activity page

- Build **Financials → Activity** powered by `financial_events` (§11).

### Phase 5 — Event-derived projections for recommendations

- Move event-adjusted cash and recommendation explanations toward event-derived
  projections, validated to equal the current calculation before switchover (§10).

### Phase 6 — Promote selected Financials read models to event-sourced projections

- Where a projection has proven equal or better to its domain table for reads,
  **promote that read model** to be event-derived (rebuildable from the log).
- Table-by-table, not all at once — use §13 (Promotion Criteria) and §14
  (Migration Matrix) per domain area.
- Domain rows may remain for write ergonomics during dual-write, or shrink to
  projection caches only where justified.

### Phase 7 / final direction — Financials event log as durable source of truth

- **`financial_events` is the authoritative record** of financial movements,
  cash-impacting actions, strategy-affecting decisions, and obligation events.
- Current financial state for recommendations, Activity, and audit is **derived
  from the log** (and maintained projections), not from ad hoc multi-table UNIONs.
- Remaining domain tables, if any, are **operational or projection convenience**,
  rebuildable when they represent financial state — not a second source of truth.

Phase 7 is a **direction**, not a deadline. We arrive there when projections and
operational experience justify it — not by rewriting every table speculatively.
Use §13 (Promotion Criteria) and §14 (Financial Domain Migration Matrix) when
deciding whether a specific domain area is ready to promote.

---

## 13. Promotion Criteria

**Purpose:** Define when a Financials domain area is allowed to move from hybrid
operation (domain table + dual-write events) to event-sourced projections (reads
and derived state primarily from `financial_events`).

Promotion is **evidence-based, not timeline-based.** A domain area promotes when
the criteria below are met for that area — not because a calendar phase flipped or
because another area already promoted. Areas can lag (e.g. settlements after
expenses) without blocking the overall program.

### Criteria (all required for the domain area being promoted)

1. **Dual-write has been operating successfully** — new and updated rows in that
   domain emit matching events in the same transaction; no sustained drift between
   table writes and ledger appends in tests or reconciliation checks.
2. **Historical backfill completed** — existing rows for that domain have
   corresponding events with deterministic `idempotency_key`s; backfill is
   re-runnable and idempotent.
3. **Event-derived calculations match existing calculations** — totals, rollups,
   and cash-impact sums from the ledger equal the current domain-table queries
   for the same date windows (automated parity tests).
4. **Financial Activity timeline validates correctly** — events for that domain
   appear on Activity (§11) with correct type, direction, amount, dates, and
   correction chains; spot-checks match operational reality.
5. **Required event types exist for the domain area** — `*_RECORDED` at minimum;
   any edit/void paths the product supports have defined event types (§7).
6. **Correction and void paths exist** — `*_CORRECTED` / `*_VOIDED` (or equivalent)
   are implemented and dual-written when the domain row is edited or voided (§8).
7. **Recommendation Engine parity assertions pass** — where the domain affects
   event-adjusted cash or recommendations, ledger-based projections match
   `loadCashEventTotals` / recommendation output for regression fixtures (§10).
8. **No known event gaps remain** — no open bugs, missing write paths, or
   reconciliation failures for that domain; known gaps are documented and block
   promotion until closed.

### How to use these criteria

- Apply **per domain area** (see §14), not globally — expenses may promote while
  settlements remain hybrid.
- Phase 6 promotion decisions should cite which criteria were verified (tests,
  backfill report, Activity QA).
- Phase 7 (log as durable source of truth) is reached when **all financially
  material domains** meet these criteria, or when remaining hybrid tables are
  explicitly scoped as non-authoritative convenience (documented exception).

---

## 14. Financial Domain Migration Matrix

**Purpose:** Concrete map of how each financial area evolves from today's CRUD
tables toward event-first architecture. Use with §13 when planning Phase 2
dual-writes and Phase 6 promotions.

> The goal is not to rewrite Financials all at once. The goal is to gradually
> promote individual financial domains once event parity is proven.

Not every area must be promoted simultaneously. **Promotion can happen
table-by-table** as each row's Phase 7 criteria (§13) are satisfied.

| Domain area                   | Current source                       | Phase 2                                                                                                                       | Phase 4                                                                      | Phase 7 target                                                                               |
| ----------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Expenses**                  | `business_expenses`                  | Dual-write `BUSINESS_EXPENSE_RECORDED`; correct/void on edit                                                                  | Activity timeline shows expense events; CRUD and totals still use table      | Reads and spend rollups from event projection; table rebuildable read model                  |
| **Inventory purchases**       | `inventory_purchases`                | Dual-write `INVENTORY_PURCHASE_RECORDED`; correct/void on edit                                                                | Activity timeline; inventory spend cards still query table                   | Event-sourced purchase history; table optional projection cache                              |
| **Payments**                  | `payments` (+ `payment_allocations`) | Dual-write `WHOLESALER_PAYMENT_RECORDED`; void/correct on edit                                                                | Activity timeline; payment CRUD and balances still use tables                | Cash outflows and payment history from events; tables rebuildable                            |
| **Owner activity**            | `owner_self_pay_transactions`        | Dual-write `OWNER_DRAW_RECORDED`, `OWNER_SELF_PAY_RECORDED`; void on void (**re-upsert/void drift — see Phase 2 follow-ups**) | Activity timeline; owner pages still use table                               | Draw/self-pay history from events; table rebuildable                                         |
| **Cash snapshots**            | `cash_snapshots`                     | Dual-write `CASH_SNAPSHOT_RECORDED` on reconcile                                                                              | Activity shows anchors; latest snapshot and Overview still use table         | Reconciliation history authoritative in ledger; latest anchor from projection or table cache |
| **Show payouts**              | `show_financials` (+ `shows`)        | Dual-write `SHOW_PAYOUT_RECORDED`, `SHOW_PAYOUT_UPDATED`                                                                      | Activity timeline; show detail and cash inflows still use table              | Payout/cash-inflow history from events; `show_financials` rebuildable                        |
| **Settlements / obligations** | `owed_line_items` (+ `adjustments`)  | Dual-write `SETTLEMENT_CREATED`, `SETTLEMENT_ADJUSTED` (may lag cash domains)                                                 | Activity timeline; balances and settlement CRUD still use tables             | Obligation history from events; balance views as projections                                 |
| **Financial strategy**        | `financial_strategy_settings`        | Dual-write `FINANCIAL_STRATEGY_CHANGED` on save                                                                               | Activity shows strategy changes; current levers still read from settings row | Change history from events; current strategy from latest event or derived projection         |

**Phase column meanings:**

- **Phase 2** — hybrid dual-write begins; domain table remains authoritative for
  reads and UI.
- **Phase 4** — Financial Activity consumes events for visibility and validation;
  operational pages may still read domain tables.
- **Phase 7 target** — that domain's financial facts and derived reads treat the
  event log as durable truth; domain table is a projection, cache, or write
  ergonomics layer — not a competing source of truth.

---

## 15. Risks and tradeoffs

- **Duplicated writes during the hybrid phase.** We write both a domain row and an
  event. _Mitigation:_ always within one transaction; `idempotency_key` to dedupe
  retries; a reconciliation check (events vs table totals) in tests.
- **Consistency / drift between events and domain tables.** An edit to a table
  without its correction event desyncs history. _Mitigation:_ funnel all financial
  writes through services that emit events; never edit financial tables ad hoc;
  cover with tests.
- **Event schema versioning.** Payload shapes will evolve. _Mitigation:_
  `event_version` per `event_type` from day one; projections handle known versions
  explicitly; never reinterpret old versions silently.
- **Correction-event complexity.** Correction/void chains add cognitive load.
  _Mitigation:_ keep the pattern uniform (`*_RECORDED` / `*_CORRECTED` /
  `*_VOIDED`), use `causation_id`, and document examples.
- **Over-engineering for a single-operator app.** Full CQRS/event sourcing on day
  one would be overkill. _Mitigation:_ hybrid ledger first, promote to source of
  truth in phases 6–7 only when projections earn it — hybrid is the bridge, not
  a dead end.
- **Queues/buses before they are needed.** Event-_driven_ infrastructure (SQS,
  bus, async projections) adds operational weight. _Mitigation:_ do **not**
  introduce queues now. Synchronous in-transaction appends are sufficient until
  scale or decoupling demands otherwise.

---

## 16. Recommendation

**Recommended next implementation: the event-ledger foundation only (Phase 1).**

Concretely, the first branch should add:

- the `financial_events` table (with `correlation_id`, `causation_id`,
  `event_version`; tenant column deferred but design tenant-ready),
- an event-writer service (`appendFinancialEvent`) with typed payloads,
- event-type constants,

…and **change no behavior** — no routes touched, no API changes, recommendations
untouched.

Then, in a following branch, wire events into the most important financial write
paths (Phase 2), starting with the ones that already drive event-adjusted cash:
expenses, inventory purchases, wholesaler payments, owner activity, cash
snapshots, strategy changes, and show payouts.

### Recommended first implementation branch

`feat/financial-events-foundation`

Scope: Phase 1 only (table + writer service + constants + tests). No UI, no API,
no dual-writes yet.

### Open questions

1. **Tenant column timing** — confirm single-business assumption holds for the
   foreseeable future, so deferring `business_id` is safe. (Current code uses a
   `scope_key = 'global'` singleton.)
2. **`actor_user_id` in dev_bypass** — Phase 1 stores actor id as `text` (not
   `uuid`), so values like `local-dev-user` are valid. Still open: record that id
   vs `NULL` in non-Cognito dev_bypass modes.
3. **Settlement events scope** — do we want `SETTLEMENT_CREATED` /
   `SETTLEMENT_ADJUSTED` in Phase 2, or defer obligations to a later phase since
   they are `NEUTRAL` for cash? (Leaning: include for history completeness, but
   they can lag the cash-moving events.)
4. **Show payout updates** — should `SHOW_PAYOUT_UPDATED` store a delta or a full
   restated value? (Leaning: full restated value in payload + prior value for
   audit.)
5. **Correction granularity** — one generic `*_CORRECTED` per concept, or
   field-level correction detail in `payload`? (Leaning: one event type per
   concept; field detail lives in `payload`.)
6. **Projection ownership** — when we reach Phase 5, do event-derived projections
   live as SQL views, materialized views, or computed in the service layer?
   (Defer until Phase 5; flagged so the Phase 1 table design does not preclude any
   option.)

**Resolved in this document:**

- **Source-of-truth promotion criteria (Phases 6–7)** — see **§13 Promotion
  Criteria** and **§14 Financial Domain Migration Matrix**.
