# FefeAve Financial Data Model (V2)

Status: Draft
Last Updated: 2026-05-28

## Purpose

This document defines **what information FefeAve should collect** so that future
analytics, profit planning, taxes, reinvestment tracking, and owner-draw features
can be built **without major schema redesigns**.

It is the data-layer companion to
[`financials-vision-v2.md`](./financials-vision-v2.md). Where the vision document
answers _"where is the product going?"_, this document answers:

> **"What data should exist to support that vision?"**

This is a **design document only**. It does not change production code, add
tables, migrations, API endpoints, UI fields, analytics, or reports. It is a
reference to consult whenever a new field, entity, or workflow is proposed.

### How to read this document

Every proposed field is tagged so the reader can tell what is real today versus
what is aspirational:

- **[Existing]** — already in the database today (verified against
  `backend/migrations/`).
- **[Recommended]** — should be added in the foreseeable future; high value,
  clearly tied to a vision question.
- **[Optional]** — plausibly useful, but only worth adding when a concrete need
  appears.

For every non-trivial field we state **why it exists** and **which future
business question it helps answer**, per the vision document's data-collection
philosophy ("Storage is cheap. Missing historical data is expensive.").

---

## Current Model at a Glance

The schema today centers on **shows → settlements → payments → balances**, plus
generalized **accounts**, **owner self-pay**, and a minimal **inventory** ledger.

| Concept (this doc)            | Backing table(s) today                                    | Notes                                                            |
| ----------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Show                          | `shows`, `show_financials`                                | Payout/gross stored per show                                     |
| Settlement                    | `owed_line_items` (+ `settlement_lines`)                  | One obligation per wholesaler per show; itemized detail optional |
| Payment                       | `payments` (+ `payment_allocations`)                      | Allocated against line items                                     |
| Wholesaler Account            | `accounts` (type `WHOLESALER`), legacy `wholesalers`      | Unified accounts model                                           |
| Owner Account                 | `accounts` (type `OWNER`), `owner_self_pay_transactions`  | Single owner account (Felicia)                                   |
| Inventory Purchase            | `inventory_purchases`                                     | Cash-based, no SKU                                               |
| Adjustments / Fees            | `adjustments` (`PLATFORM_FEE`, `REFUND`, …)               | Fees captured as adjustments, not first-class                    |
| Business Expense              | `owed_line_items` w/ `obligation_kind=VENDOR_EXPENSE`     | Vendor-only; not general overhead                                |
| Owner Draw (future)           | `owner_self_pay_transactions.transaction_type=OWNER_DRAW` | Type exists; not yet a planning surface                          |
| Tax Reserve (future)          | _none_                                                    | Gap                                                              |
| Reinvestment Reserve (future) | _none_                                                    | Gap                                                              |

> **Convention:** "Settlement" in product language maps to the
> `owed_line_items` row whose `obligation_kind = 'SHOW_LINKED'`. The same table
> also stores manual vendor expenses (`obligation_kind = 'VENDOR_EXPENSE'`).

---

## 1. Show

### Purpose

Represents a live selling event (Whatnot, Instagram, or manual). The unit around
which revenue, payouts, and per-event profitability are measured. Shows are the
primary lens for the vision document's **Show Performance** questions.

> **Implementation note (2026-05-28, branch `feat/inventory-enrichment-foundation`):**
> The near-term profitability-capture fields **`shows.started_at`**,
> **`shows.ended_at`** (timestamptz), and **`show_financials.platform_fee_amount`**
> (numeric) are now implemented as nullable, backward-compatible columns. They are
> captured optionally on the Log Show form; no profit-per-hour or platform
> comparison analytics were built — capture only, per the "collect data before
> building analytics" guideline.

### Core fields — [Existing]

| Field                                                 | Type                                               | Why it exists                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                                  | uuid                                               | Identity                                                                                                                                   |
| `name`                                                | varchar                                            | Human label for the show                                                                                                                   |
| `show_date`                                           | date                                               | When the show occurred; drives time-series grouping                                                                                        |
| `location`                                            | varchar                                            | Free-text venue/context                                                                                                                    |
| `platform`                                            | enum `WHATNOT \| INSTAGRAM \| MANUAL`              | Which channel hosted the show                                                                                                              |
| `source`                                              | enum                                               | How the record originated (channel of record)                                                                                              |
| `external_reference`                                  | varchar                                            | Link back to the platform's own ID                                                                                                         |
| `status`                                              | enum `PLANNED \| ACTIVE \| COMPLETED \| CANCELLED` | Lifecycle / open-vs-closed                                                                                                                 |
| `started_at` / `ended_at`                             | timestamptz (nullable)                             | **[Implemented]** Show duration → future "profit per hour" / "best shows by time spent". Raw timestamps stored (not a derived `duration`). |
| `notes`                                               | text                                               | Operator memo                                                                                                                              |
| `created_by`, `created_via`, timestamps, `deleted_at` | —                                                  | Provenance / audit / soft delete                                                                                                           |

Per-show money lives in **`show_financials`** (1:1 with a show):

| Field                      | Type               | Why it exists                                                                                                           |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `payout_after_fees_amount` | numeric            | Net payout received from the platform                                                                                   |
| `gross_sales_amount`       | numeric (nullable) | Top-line sales before fees (often unknown today)                                                                        |
| `platform_fee_amount`      | numeric (nullable) | **[Implemented]** Explicit platform fee → future after-fee platform comparison without inferring from `gross − payout`. |
| `currency`                 | text (USD)         | Reserved for future multi-currency                                                                                      |

### Recommended future fields

| Field                               | Tag                   | Why / Question supported                                                |
| ----------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `day_of_week` (derived, not stored) | [Recommended-derived] | "Which days perform best?" — derive from `show_date`; **do not** store. |

### Optional future fields

| Field                                    | Tag        | Why / Question supported                                                                                           |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `category_focus` (text/enum)             | [Optional] | "Do clothing shows outperform accessory shows?" Only valuable once inventory categories exist.                     |
| `viewer_count` / `order_count` (integer) | [Optional] | Engagement vs. profit correlation. Only if a platform import can populate it reliably — manual entry is low-value. |
| `host_user_id` (uuid)                    | [Optional] | Multi-host attribution; irrelevant while the business is single-operator.                                          |

### Future questions supported

- Which platform performs best / is most profitable (after fees)?
- Which show generates the most profit? Highest margin?
- What is average payout per show? Average profit per hour?
- Which days/times perform best?

---

## 2. Settlement

> Backed by `owed_line_items` (`obligation_kind = 'SHOW_LINKED'`), with optional
> line-level detail in `settlement_lines`.

### Purpose

The amount a wholesaler is owed for their participation in a show. Settlements
are the bridge between **Show revenue** and **Wholesaler balances**, and the
basis for the current profit model (`Profit = Payout − Settlements`).

### Core fields — [Existing]

| Field                                                 | Type                                                 | Why it exists                                  |
| ----------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `id`                                                  | uuid                                                 | Identity                                       |
| `show_id`                                             | uuid (nullable for vendor expenses)                  | Links obligation to its show                   |
| `wholesaler_id` / `account_id`                        | uuid                                                 | Who is owed                                    |
| `amount`                                              | numeric                                              | The obligation total                           |
| `currency`                                            | varchar (USD)                                        | Multi-currency reserve                         |
| `description`                                         | text                                                 | What the settlement is for                     |
| `due_date`                                            | date (nullable)                                      | When payment is expected                       |
| `status`                                              | enum `PENDING \| PARTIALLY_PAID \| PAID \| ADJUSTED` | Payment progress                               |
| `calculation_method`                                  | text (`MANUAL`, `ITEMIZED`, `PERCENT`, …)            | How `amount` was derived                       |
| `rate_bps`, `base_amount`                             | int / numeric                                        | Inputs for percent-based settlements           |
| `obligation_kind`                                     | text `SHOW_LINKED \| VENDOR_EXPENSE`                 | Distinguishes settlements from vendor expenses |
| `created_by`, `created_via`, timestamps, `deleted_at` | —                                                    | Provenance / audit                             |

`settlement_lines` (itemized detail): `item_name`, `quantity`,
`unit_price_cents`, `line_total_cents`. **[Existing]**

### Recommended future fields

| Field                      | Tag           | Why / Question supported                                                                                                               |
| -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `settled_at` (timestamptz) | [Recommended] | When the settlement was agreed/locked (distinct from `created_at`). Supports "time from show close to settlement" operational metrics. |

### Optional future fields

| Field                                   | Tag        | Why / Question supported                                                                                                                                                        |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `item_category` (on `settlement_lines`) | [Optional] | Category-level revenue attribution; only after a shared category vocabulary exists (see §6).                                                                                    |
| `cost_basis_amount`                     | [Optional] | True per-settlement margin instead of show-level margin. High value but requires inventory-to-settlement linkage that does not exist today — defer until inventory is itemized. |

### Future questions supported

- Which wholesalers generate the most revenue / largest obligations?
- What share of show payout is consumed by settlements (margin)?
- (With categories) which product categories drive settlement value?

---

## 3. Payment

### Purpose

Money paid **to a wholesaler** against their outstanding settlements. Drives
balance reduction and wholesaler payment-behavior analytics.

### Core fields — [Existing]

| Field                                                 | Type                                                        | Why it exists                               |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `id`                                                  | uuid                                                        | Identity                                    |
| `wholesaler_id` / `account_id`                        | uuid                                                        | Who was paid                                |
| `amount`                                              | numeric                                                     | Payment size                                |
| `currency`                                            | varchar (USD)                                               | Multi-currency reserve                      |
| `payment_date`                                        | date                                                        | When paid; timing analytics                 |
| `payment_method`                                      | enum `CHECK \| WIRE \| ACH \| CASH \| CREDIT_CARD \| OTHER` | How paid; reconciliation + fee implications |
| `reference`                                           | varchar                                                     | External txn reference                      |
| `notes`                                               | text                                                        | Operator memo                               |
| `created_by`, `created_via`, timestamps, `deleted_at` | —                                                           | Provenance / audit                          |

`payment_allocations` (`payment_id`, `line_item_id`, `amount`) records which
settlements a payment satisfied. **[Existing]**

### Recommended future fields

| Field                  | Tag                    | Why / Question supported                                                                                                                                                           |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fee_amount` (numeric) | [Optional→Recommended] | Some methods (wire, card) carry costs. Capturing payment fees feeds true cash outflow in the planning model. Recommend only once a method with non-trivial fees is used regularly. |

### Optional future fields

| Field                      | Tag        | Why / Question supported                                                                          |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `cleared_at` (timestamptz) | [Optional] | Distinguish "recorded" from "cleared" for cash-position accuracy. Only if float becomes material. |

### Future questions supported

- Which wholesalers are paid most consistently / fastest?
- Average days from settlement to payment?
- Cash outflow by period and method.

---

## 4. Wholesaler Account

> Backed by `accounts` (`type = 'WHOLESALER'`); legacy `wholesalers` retained and
> mapped via `accounts.legacy_wholesaler_id`.

### Purpose

The party FefeAve owes money to. Anchor for balances, payments, and
wholesaler-performance questions. Per the vision, Accounts are the **setup layer**
of the Financials workspace.

### Core fields — [Existing]

| Field                                          | Type (source)                                  | Why it exists             |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------- |
| `id`                                           | uuid (`accounts`)                              | Identity                  |
| `display_name`                                 | varchar                                        | Account label             |
| `type`                                         | enum `OWNER \| WHOLESALER`                     | Account class             |
| `status`                                       | enum `ACTIVE \| ARCHIVED`                      | Lifecycle                 |
| `linked_user_id`                               | uuid                                           | Portal login linkage      |
| `contact_name / contact_email / contact_phone` | varchar                                        | Communication             |
| `pay_schedule`                                 | enum `AD_HOC \| WEEKLY \| BIWEEKLY \| MONTHLY` | Expected payment cadence  |
| `notes`                                        | text                                           | Operator memo             |
| `legacy_wholesaler_id`                         | uuid                                           | Back-compat mapping       |
| timestamps, `deleted_at`                       | —                                              | Audit / soft delete       |
| `tax_id`, `address` (jsonb)                    | varchar/jsonb (`wholesalers`)                  | Retained on legacy record |

### Recommended future fields

| Field                  | Tag           | Why / Question supported                                                                                           |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `category` (text/enum) | [Recommended] | "Which _types_ of wholesalers perform best?" Group analytics without per-show tagging. Low risk (see Near-Term §). |

### Optional future fields

| Field                         | Tag        | Why / Question supported                                      |
| ----------------------------- | ---------- | ------------------------------------------------------------- |
| `default_settlement_rate_bps` | [Optional] | Pre-fill percent settlements; convenience, not analytics.     |
| `region` / `state`            | [Optional] | Geographic mix; only if sourcing decisions ever depend on it. |

### Future questions supported

- Which wholesalers generate the most revenue / profit?
- Which maintain the largest balances or need the most follow-up?
- (With category) which wholesaler categories are most profitable?

---

## 5. Owner Account

> Backed by `accounts` (`type = 'OWNER'`, single row) and
> `owner_self_pay_transactions`.

### Purpose

Represents the business owner (Felicia) in the ledger. Tracks **self-pay / owner
draw** activity, distinct from wholesaler balances. Foundation for the future
**owner-draw** planning feature.

### Core fields — [Existing]

Account row: same `accounts` shape as §4, constrained to one `OWNER`.

`owner_self_pay_transactions`:

| Field                                  | Type                          | Why it exists                               |
| -------------------------------------- | ----------------------------- | ------------------------------------------- |
| `id`                                   | uuid                          | Identity                                    |
| `account_id`, `account_type`           | uuid / enum (OWNER)           | Owner linkage                               |
| `amount`                               | numeric                       | Payout size                                 |
| `week_start_date` / `week_end_date`    | date                          | Weekly bucketing (one active row per week)  |
| `paid_at`                              | timestamptz                   | When the payout occurred                    |
| `transaction_type`                     | enum `OWNER_DRAW \| SELF_PAY` | **Already distinguishes draw vs. self-pay** |
| `reference`, `note`                    | varchar / text                | Memo / reconciliation                       |
| `voided_at`                            | timestamptz                   | Reversal for audit history                  |
| `created_by`, timestamps, `deleted_at` | —                             | Provenance / audit                          |

### Recommended future fields

| Field                                                        | Tag                                | Why / Question supported                                                                                                          |
| ------------------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `source_reserve` (enum: `OPERATING \| REINVESTMENT \| NONE`) | [Recommended, when reserves exist] | Tie a draw to the planning bucket it was funded from; answers "Was this draw within safe limits?" Only meaningful once §9 exists. |

### Future questions supported

- How much has the owner drawn vs. reinvested over time?
- How much can safely be paid as owner draw (with the planning model)?

> **Note (gap):** "Owner Draw" as a _planning surface_ is future, but the
> `OWNER_DRAW` transaction type **already exists**. Future work is mostly
> aggregation + planning UI, not schema redesign.

---

## 6. Inventory Purchase

### Purpose

Cash spent acquiring inventory. Historically a minimal ledger; the **largest
data gap** relative to the vision's Inventory Performance questions. Enrichment
of this entity is now **in progress** (see implementation note below).

> **Implementation note (2026-05-28, branch `feat/inventory-enrichment-foundation`):**
> The near-term inventory enrichment fields **`supplier`**, **`category`**, and
> **`purchase_type`** have begun implementation as nullable, backward-compatible
> columns on `inventory_purchases`. `category` and `purchase_type` are stored as
> **text** (not DB enums) but constrained to fixed values in the application
> layer (`backend/src/constants/inventory.ts` /
> `frontend/src/lib/constants/inventory.ts`); `supplier` is free text. No
> analytics, ROI, supplier table, or inventory↔show linkage were added — only
> data capture, per this document's "collect data before building analytics"
> guideline.

### Core fields — [Existing]

| Field           | Type                             | Why it exists                                                                                                                            |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | uuid                             | Identity                                                                                                                                 |
| `purchase_date` | date                             | When bought; monthly spend grouping                                                                                                      |
| `amount`        | numeric                          | Cost                                                                                                                                     |
| `notes`         | text                             | Free-text (e.g. "Pallet #3")                                                                                                             |
| `supplier`      | text (nullable)                  | **[Implemented]** Free-text supplier name → "Which suppliers perform best / highest ROI?"                                                |
| `category`      | text (nullable, app-constrained) | **[Implemented]** Clothing / Shoes / Accessories / Mixed / Other → "Which categories produce the highest ROI?"                           |
| `purchase_type` | text (nullable, app-constrained) | **[Implemented]** Pallet / Shelf Pulls / Liquidation / Returned Merchandise / Consignment / Other → "Which purchase types perform best?" |
| `created_at`    | timestamptz                      | Provenance                                                                                                                               |

### Recommended future fields

| Field                       | Tag      | Why / Question supported                                                                        |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `supplier` → `suppliers` FK | [Future] | Promote free-text `supplier` to a normalized `suppliers` table only once real values stabilize. |

### Optional future fields

| Field                             | Tag        | Why / Question supported                                                                                                                                    |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit_count` (integer)            | [Optional] | Cost-per-unit metrics; only if counts are reliably known at purchase time.                                                                                  |
| `expected_resale_value` (numeric) | [Optional] | Forward ROI estimate — borders on forecasting (a vision non-goal); defer.                                                                                   |
| `linked_show_id` (uuid)           | [Optional] | Attribute inventory to the show that sold it. High analytical value but requires a sell-through workflow that does not exist; **do not** add speculatively. |

### Future questions supported

- How much inventory is purchased monthly?
- Which suppliers / categories / purchase types generate the highest ROI?
- How much cash is currently tied up in inventory?

---

## 7. Owner Draw _(future)_

### Purpose

A deliberate withdrawal of profit by the owner, framed by the planning model
(`Recommended Owner Draw = Available Cash − Reinvestment Reserve`).

### Status

**Partially exists.** `owner_self_pay_transactions.transaction_type` already
includes `OWNER_DRAW`. The future need is a **planning view** that compares draws
against safe limits — not a new core table.

### Recommended future fields (on the existing transaction)

| Field                                 | Tag           | Why / Question supported                                                                                                                  |
| ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `period_label` (text, e.g. `2026-Q1`) | [Optional]    | Group draws into planning periods for "how much have I taken this quarter?" Derivable from dates; store only if periods are non-calendar. |
| `source_reserve`                      | [Recommended] | See §5 — funding bucket attribution.                                                                                                      |

### Future questions supported

- How much can I safely pay myself this period?
- How much have I drawn YTD vs. reinvested?

---

## 8. Tax Reserve _(future)_

### Purpose

Money set aside from operating profit for taxes
(`Available Cash = Operating Profit − Tax Reserve`). **No backing table exists
today — this is a true gap.**

### Recommended future shape — [Recommended, deferred]

A `tax_reserves` (or generalized `reserves`) ledger of allocations:

| Field                                | Tag           | Why / Question supported                                                                        |
| ------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------- |
| `id`                                 | [Recommended] | Identity                                                                                        |
| `period_start` / `period_end` (date) | [Recommended] | Which period the reserve covers                                                                 |
| `reserve_rate_bps` (int)             | [Recommended] | The % of profit reserved (e.g. 2500 = 25%) — captures _intent_, supports "what rate did I use?" |
| `amount` (numeric)                   | [Recommended] | Actual reserved amount                                                                          |
| `basis_profit_amount` (numeric)      | [Recommended] | The profit figure the reserve was computed from (audit/repeatability)                           |
| `note` (text)                        | [Optional]    | Rationale                                                                                       |
| timestamps, `created_by`             | [Recommended] | Provenance                                                                                      |

> **Design note:** keep this as a **planning ledger**, not an accounting system
> (vision non-goal: "not a tax filing platform"). Store intent + amount, not tax
> rules.

### Future questions supported

- How much should be reserved for taxes this period?
- How much is currently held in reserve?

---

## 9. Reinvestment Reserve _(future)_

### Purpose

Money earmarked for buying more inventory / growing the business
(`Recommended Owner Draw = Available Cash − Reinvestment Reserve`). **No backing
table today — a true gap.**

### Recommended future shape — [Recommended, deferred]

Mirror the Tax Reserve shape (ideally **one shared `reserves` table** with a
`reserve_type` discriminator: `TAX | REINVESTMENT`):

| Field                                                                              | Tag           | Why / Question supported                                                         |
| ---------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `reserve_type` (enum `TAX \| REINVESTMENT`)                                        | [Recommended] | Unify reserves; avoids two near-identical tables                                 |
| `period_start` / `period_end`, `amount`, `basis_profit_amount`, `note`, provenance | [Recommended] | Same rationale as §8                                                             |
| `consumed_amount` (numeric)                                                        | [Optional]    | Track reinvestment actually spent (e.g. linked to inventory purchases) vs. held. |

### Future questions supported

- How much should be reinvested?
- How much reinvestment budget remains unspent?

---

## 10. Business Expenses

### Purpose

General operating costs **not** owed to a wholesaler and **not** inventory —
e.g. shipping supplies, software, subscriptions, fees, rent. Needed for the
vision's **Operating Profit** model:

```
Operating Profit = Revenue − Settlements − Inventory − Platform Fees − Business Expenses
```

### Status — [Implemented]

Table **`business_expenses`** (migration `1780030000000_business_expenses`). General
operating costs not owed to a wholesaler and not inventory. API: `POST/GET
/business-expenses`, `GET /admin/business-expenses-total`.

| Field          | Status      | Notes                      |
| -------------- | ----------- | -------------------------- |
| `id`           | Implemented | UUID PK                    |
| `expense_date` | Implemented | date                       |
| `amount`       | Implemented | numeric(19,4), CHECK > 0   |
| `category`     | Implemented | text; app-validated enum   |
| `notes`        | Implemented | optional text              |
| timestamps     | Implemented | `created_at`, `updated_at` |

Categories: Shipping, Supplies, Software, Travel, Equipment, Other.

Optional future fields (`vendor`, `payment_method`, soft delete) remain deferred.

### Future questions supported

- What is true operating profit (after all costs)?
- Which overhead categories are growing?

---

## Financial Strategy Settings — [Implemented]

Table **`financial_strategy_settings`** (migration `1780035000000_financial_strategy_settings`).
One global row (`scope_key = 'global'`). API: `GET/PUT /financial-strategy`.

| Field                | Status      | Notes                     |
| -------------------- | ----------- | ------------------------- |
| `strategy_type`      | Implemented | preset or CUSTOM          |
| `tax_reserve_bps`    | Implemented | 0–10000                   |
| `reinvestment_bps`   | Implemented | 0–10000                   |
| `cash_buffer_amount` | Implemented | numeric(19,4), CHECK >= 0 |

Presets: Conservative Growth, Balanced, Income Focused, Custom.

---

## Cash Snapshots — [Implemented]

Table **`cash_snapshots`** (migration `1780040000000_cash_snapshots`). One
business-wide manual cash total in V1. API: `GET /cash-snapshots/latest`,
`POST /cash-snapshots`.

| Field           | Status      | Notes                      |
| --------------- | ----------- | -------------------------- |
| `snapshot_date` | Implemented | date                       |
| `amount`        | Implemented | numeric(19,4), CHECK >= 0  |
| `source`        | Implemented | `MANUAL` in V1             |
| `notes`         | Implemented | optional text              |
| timestamps      | Implemented | `created_at`, `updated_at` |

Recommendation Engine V1 reads the latest snapshot amount as current cash.
Event-adjusted estimation from tracked events remains deferred.

---

# Data Collection Guidelines

These rules govern whether a field should be added. They restate and operationalize
the vision document's data-collection philosophy.

1. **Collect data before building analytics.** Capture the raw fact now; build the
   report later. A field added today gives a year of history by the time a report
   ships.
2. **Every field should support a future business question.** If you cannot name
   the question, do not add the field. (Use the per-field "Question supported"
   column in this doc as the bar.)
3. **Avoid collecting data with no foreseeable use.** Speculative fields add
   schema weight, UI clutter, and migration risk for no payoff.
4. **Historical data is more valuable than perfect analytics.** Prefer storing
   raw, durable facts (e.g. `started_at`/`ended_at`) over derived values
   (`duration`) that lock in one interpretation.

### Supporting principles

- **Store raw, derive on read.** Day-of-week, duration, margins, and balances
  should be computed from stored primitives, not persisted.
- **Free-text first, enum/FK later.** For emerging dimensions (supplier), start
  with free-text, observe real values, then normalize once they stabilize.
- **Keep planning ledgers separate from accounting truth.** Reserves and draws
  are _decisions_, recorded as their own rows; they must never distort balance or
  settlement math.
- **One discriminated table beats many near-identical ones** (e.g. a single
  `reserves` table with `reserve_type`).

---

# Suggested Near-Term Fields

Low-risk, high-value fields worth capturing **soon** because they unlock vision
questions with minimal schema or UX cost. None require analytics to ship first —
they just start accumulating history.

| Field                     | Entity                   | Why valuable                                                                                            | Risk of adding                                                                                                                                      | Now or later?                                                            |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `supplier`                | Inventory Purchase       | Unlocks "best suppliers / highest ROI" (top vision Inventory question). Currently impossible to answer. | **Low.** Nullable free-text column; no balance impact; backfill optional.                                                                           | **Now** (as free-text).                                                  |
| `category`                | Inventory Purchase       | Unlocks "which categories ROI best" + monthly mix.                                                      | **Low.** Nullable enum; small UI dropdown. Risk is only choosing the enum values — keep an `Other`.                                                 | **Now.**                                                                 |
| `purchase_type`           | Inventory Purchase       | Unlocks "which purchase types perform best" (pallet vs. liquidation, etc.).                             | **Low.** Same as category.                                                                                                                          | **Now.**                                                                 |
| `started_at` / `ended_at` | Show                     | Unlocks **profit-per-hour**, the headline Show metric, and is impossible to reconstruct retroactively.  | **Low–Medium.** Two nullable timestamps; optional manual entry. Risk: operators may skip entry → sparse data. Mitigate by making it quick/optional. | **Now** (optional capture) — historical loss is permanent.               |
| `category`                | Wholesaler Account       | Enables grouped wholesaler performance without per-show tagging.                                        | **Low.** Nullable enum/text on `accounts`.                                                                                                          | **Soon** (after inventory category vocabulary settles, to reuse values). |
| `platform_fee_amount`     | Show (`show_financials`) | Clean after-fee platform comparison instead of inferring from `gross − payout`.                         | **Low.** Nullable numeric; today derivable but lossy.                                                                                               | **Soon.**                                                                |
| `notes`                   | Show                     | Already exists — ensure it's surfaced for qualitative context.                                          | **None** ([Existing]).                                                                                                                              | **Already present.**                                                     |

> **Deliberately NOT near-term:** reserves (§8/§9), business expenses (§10),
> inventory→show linkage, and cost-basis fields. These are valuable but require
> new workflows or new tables and should follow a dedicated design, not a quick
> column add.

---

# Gaps in the Current Model

Concrete gaps discovered while reconciling this design against
`backend/migrations/`:

1. **Inventory is too thin.** _Being addressed_ — `supplier`, `category`, and
   `purchase_type` are now in implementation (branch
   `feat/inventory-enrichment-foundation`). ROI still requires inventory↔revenue
   linkage (not in scope). Was the **biggest gap**.
2. **No general business-expense entity.** Operating Profit in the vision model
   subtracts "Business Expenses," but only _vendor_ expenses exist (as
   `owed_line_items`). Overhead (software, shipping, fees, rent) has no home.
3. **No reserves.** Tax Reserve and Reinvestment Reserve have no backing data,
   so "how much to reserve / reinvest / safely draw" cannot be computed.
4. **Platform fees are implicit.** _Being addressed_ —
   `show_financials.platform_fee_amount` is now implemented (capture only). Fee
   history will accrue going forward; historical rows remain implicit
   (`gross − payout` / `adjustments`).
5. **Show duration is unrecorded.** _Being addressed_ — `shows.started_at` /
   `shows.ended_at` are now implemented and captured optionally on the Log Show
   form. Past shows stay null (not reconstructable), so fill rate going forward
   matters.
6. **`gross_sales_amount` is frequently null.** Revenue-based metrics (vs.
   payout-based) are unreliable until gross capture is more consistent.
7. **Owner Draw vs. Self-Pay are stored but not planned.** The `transaction_type`
   discriminator exists; the planning layer that uses it does not. (This is a
   feature gap, not a schema gap — noted as a positive.)

---

# Top 3–5 Fields to Begin Collecting Next

> **Status:** all five below are now **implemented** (capture only) on branch
> `feat/inventory-enrichment-foundation` — #1–#3 as inventory enrichment, #4–#5
> as the show-profitability foundation. Kept here for traceability.

Prioritized recommendation. All are low-risk additive columns; each maps directly
to a stated vision question and accrues irrecoverable history if delayed.

1. **`inventory_purchases.supplier`** (free-text) — unblocks supplier ROI; today
   completely unanswerable.
2. **`inventory_purchases.category`** (enum) — unblocks category ROI and monthly
   inventory mix.
3. **`inventory_purchases.purchase_type`** (enum) — unblocks purchase-type
   performance comparisons.
4. **`shows.started_at` / `shows.ended_at`** (timestamps) — unblocks
   profit-per-hour; historical data is permanently lost if not captured now.
5. **`show_financials.platform_fee_amount`** (numeric) — clean after-fee platform
   profitability comparison.

> Recommendation: treat #1–#3 as a single small "inventory enrichment" effort
> (they share one form), and #4–#5 as a "show profitability" effort. Each is a
> handful of nullable columns plus optional UI — no redesign required.

---

# Risks & Open Questions

- **Enum governance.** `category` / `purchase_type` enums will evolve. Decide
  early: DB enum (migration to change) vs. lookup table vs. free-text +
  normalization. Recommendation: **free-text or lookup table** for fast-moving
  dimensions; DB enums only for truly stable sets.
- **Sparse optional data.** Optional fields (duration, supplier) are only as
  useful as their fill rate. Open question: make them required-ish via UX nudges,
  or accept partial history?
- **Reserves as ledger vs. setting.** Are tax/reinvestment reserves a running
  ledger of allocations, or a single configurable rate applied on read? This doc
  assumes a **ledger** (auditable history); confirm before building §8/§9.
- **Inventory ↔ revenue linkage.** True ROI needs purchases tied to the
  shows/settlements that sold them. That requires a sell-through workflow not yet
  designed. Open question: is purchase-level ROI (spend vs. period revenue) "good
  enough," or is item-level attribution required?
- **Gross sales reliability.** Should `gross_sales_amount` become required (where
  the platform provides it) to make revenue-based metrics trustworthy?
- **Single-owner assumption.** Owner Account and several "host"/draw concepts
  assume one operator. Revisit if the business adds operators.
- **Scope discipline.** Several future entities (reserves, expenses) flirt with
  the vision's non-goals (tax filing, accounting). Keep them as **planning
  inputs**, not bookkeeping — re-check against `financials-vision-v2.md` before
  implementing.

---

## Cross-References

- [`financials-vision-v2.md`](./financials-vision-v2.md) — product vision and
  future business questions this data model serves.
- `backend/migrations/` — source of truth for all **[Existing]** fields cited
  here.
