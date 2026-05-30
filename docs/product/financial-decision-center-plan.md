# FefeAve Financial Decision Center — Product & Technical Plan

Status: Living document (tracks implemented phases)
Last Updated: 2026-05-30
Scope: Product and technical plan for the Financial Decision Center. Phases 1–4
are implemented on branch `feat/expenses-foundation`; see phase status in §6.

Related: [`docs/product/financials-vision-v2.md`](./financials-vision-v2.md)

---

## 1. Product Goal

FefeAve is moving from **financial tracking** to **financial decision support**.

The tracking foundation already exists. The application reliably records shows,
settlements, payments, balances, inventory purchases, show timing, and platform
fees. That makes FefeAve a trustworthy source of truth for _what happened_.

The next stage answers _what to do next_. The Financial Decision Center exists to
help Felicia decide:

- How much to spend on inventory
- How much to save for taxes
- How much to reinvest in the business
- How much she can safely take home as an owner draw

This is a deliberate shift in product responsibility:

| Before                          | After                                 |
| ------------------------------- | ------------------------------------- |
| Record transactions accurately  | Record transactions accurately        |
| Show historical totals          | Turn totals into a live cash picture  |
| Leave decisions to the operator | Suggest safe, explainable allocations |

The Decision Center does not replace the operator's judgment. It removes the
spreadsheet math and the guesswork so the operator can make a confident decision
in seconds.

---

## 2. Core Model

All decision support flows through four stages. Each stage is a clean layer that
the codebase should keep separated so future features slot in without rework.

```
Raw financial data
   ↓
Live financial snapshot
   ↓
Strategy settings
   ↓
Recommendations
```

### Raw financial data

The transactional records already captured by the system: shows, payouts,
settlements, payments, balances, inventory purchases (with enrichment), show
timing, platform fees, and owner activity. This is the source of truth and is
never modified by the decision layer.

### Live financial snapshot

A computed, read-only view of the current financial position derived from raw
data. It answers "where do things stand right now" — current estimated cash
(from reconciliation + tracked events), outstanding balances, inventory spend,
expenses, and estimated profit. It holds no opinions and stores no settings.

### Strategy settings

The operator's chosen policy for how money should be allocated: tax reserve %,
reinvestment target %, and cash buffer target. Expressed as a preset
(Conservative Growth, Balanced, Income Focused) or a Custom configuration.

### Recommendations

The snapshot run through the active strategy to produce suggested actions:
tax reserve to set aside, inventory budget to spend, and owner draw to take home.
Every recommendation is explainable from its inputs and the strategy used.

This separation is intentional: the snapshot can be correct without any strategy
chosen, and a strategy can be changed without touching raw data.

---

## 3. Financial Concepts

These are the working definitions the Decision Center is built around. They are
planning definitions for decision support — not accounting or tax definitions.

- **Current cash** — Money actually available right now for the business. In V1
  this is derived from a manual cash snapshot plus tracked events since that
  snapshot (see **Current Cash Strategy (V1)** below). Outstanding receivables
  are tracked separately and do not count as current cash.

- **Outstanding balances** — Money owed _to_ the business (e.g. unpaid wholesaler
  balances). Expected future cash, not yet available. Creating a settlement does
  not move cash; only recording a payment moves cash. Outstanding balances do not
  count toward current estimated cash until money is actually received.

- **Inventory spend** — Money spent acquiring inventory over a period, sourced
  from inventory purchases including enrichment (supplier, category, type).

- **Business expenses** — Operating costs that are not inventory or settlements
  (shipping, supplies, software, travel, equipment, other). Captured in Phase 1.

- **Estimated profit** — A planning estimate of what the business earned:
  revenue minus settlements, inventory, platform fees, and business expenses.
  An estimate for decisions, not a tax figure.

- **Tax reserve** — Cash that should be set aside for taxes. In **Recommendation
  Engine V1**, the recommendation is `current cash × tax reserve %` (snapshot
  amount × strategy). Money to _protect_, not spend. Not a tax filing figure.

- **Reinvestment target** — The portion of available cash earmarked for growing
  the business (more inventory, tooling, etc.), set by the strategy's
  reinvestment %.

- **Cash buffer** — A safety floor of cash that should always remain on hand to
  absorb timing gaps and surprises. Defined by the strategy's cash buffer target.

- **Available cash** — Cash that is genuinely free to allocate after protecting
  the tax reserve and the cash buffer. The basis for every suggestion.

- **Suggested owner draw** — How much the operator can safely take home after tax
  reserve, cash buffer, and reinvestment target are honored.

- **Suggested inventory budget** — How much can be spent on new inventory without
  breaching the tax reserve or cash buffer, guided by the reinvestment target.

### Current Cash Strategy (V1)

Current cash will initially be maintained using **manual cash snapshots**.

**V1 granularity:** one business-wide cash snapshot. The operator records a
single total business cash amount. There is no per-account tracking in V1 — no
checking/savings/PayPal/Venmo breakdown.

- The operator periodically records actual business cash on hand.
- FefeAve uses that snapshot as a **reconciliation point**.
- After the snapshot is recorded, FefeAve **estimates current cash** by applying
  tracked cash events since the snapshot (see **Cash Estimation Events** below).
- The system should display:
  - **Current estimated cash**
  - **Last reconciliation date**
  - **Snapshot source** (e.g. manual entry)

This model keeps V1 simple and accurate enough for decision support without
requiring bank connectivity on day one.

Future versions may support multiple accounts, account-level reconciliation, and
bank-linked balances. Recommendation logic should continue operating on a
**business-wide cash position** regardless of how many accounts feed it.

#### Cash Estimation Events

Only events that actually move cash affect the estimate. Direction matters.

**Cash inflows**

- Show payouts

**Cash outflows**

- Wholesaler payments
- Inventory purchases
- Business expenses
- Owner draws

**Platform fees are not cash events.** Payouts are already recorded after fees.
Platform fees affect reporting and profitability analysis, not cash estimation.

**Settlements and cash**

Creating a settlement does not move cash. Recording a payment moves cash.
Outstanding balances are expected future cash and do not count toward current
estimated cash until money is actually received.

#### Reconciliation drift

If estimated cash differs from actual cash at the next reconciliation, that
usually indicates one or more of:

- Missing records in FefeAve
- Personal spending mixed with business cash
- Transfers between accounts
- Bank fees
- Untracked business activity

The goal of reconciliation is **not** to force the system to match reality.
The goal is to identify gaps — missing records, personal spending, transfers,
fees, and untracked business activity — so recommendations rest on trustworthy
data. Reconciliation **improves confidence in recommendations**, not error
counting.

The operator records a fresh snapshot; the system resets the estimate from that
anchor. Over time, drift patterns can surface gaps in expense or owner-activity
capture.

#### V1 cash snapshot example

```
Cash snapshot:           $10,000

Subsequent events:
  + $2,000  show payouts
  -   $500  inventory purchases
  -   $300  business expenses

Current estimated cash:    $11,200
```

The operator later reconciles against actual cash on hand:

```
Actual cash (reconcile): $11,050
```

A new reconciliation point is established at $11,050. Estimation resumes from
that anchor. The $150 gap ($11,200 estimated vs. $11,050 actual) is drift —
not a system failure — and may prompt the operator to capture missing expenses
or note personal spending.

### Future Cash Sources

**V1**

- Manual cash snapshots

**Future**

- Bank-connected balances
- Plaid / Stripe Financial Connections / similar providers

Important design constraints:

- Future bank integrations should **feed the same cash snapshot model** — a
  provider balance becomes another way to establish or confirm a reconciliation
  point, not a separate cash concept.
- **Recommendation logic should never depend directly on a bank provider.** The
  overview and strategy layers consume an abstract cash position, not raw API
  responses.
- **Cash source should be abstracted** so manual and bank-fed snapshots use the
  same downstream calculations (estimated cash, available cash, owner draw, etc.).
- **Multi-account support is a future input concern, not a recommendation concern.**
  Even when multiple accounts or bank feeds exist, the strategy and overview
  layers continue to operate on one business-wide cash position.

---

## 4. Strategy Presets

Version 1 ships fixed presets plus a Custom option. Presets are starting points,
not locks — Custom always lets the operator override the three core levers
(tax reserve %, reinvestment %, cash buffer target).

### Conservative Growth

- Higher reinvestment
- Lower owner draw
- Prioritizes building the business and protecting against downside

### Balanced

- Balanced reinvestment and owner draw
- A reasonable default for steady operation

### Income Focused

- Higher owner draw
- Lower reinvestment
- Prioritizes taking money home when growth is not the immediate goal

### Custom

- User-defined tax reserve %
- User-defined reinvestment %
- User-defined cash buffer target

**AI is not required for Version 1.** Presets are deterministic, transparent, and
fully usable on their own. The strategy layer must work end to end with manual
presets before any intelligence is layered on top.

---

## 5. Future AI / Smart Recommendations

AI is a later enhancement to an already-working manual system, introduced in
stages so trust is earned before autonomy is granted.

- **V1 — Manual strategy presets.** The operator picks a preset (or Custom).
  Recommendations are pure, explainable formulas. No AI.

- **V2 — Smart explanations.** AI improves how recommendations are explained:
  plain-language summaries of why a number was suggested, what drove it, and what
  would change it. AI clarifies; it does not decide.

- **V3 — Intelligent recommendations.** AI suggests strategy adjustments based on
  observed patterns (seasonality, platform performance, cash trends) and presents
  them as proposals for the operator to accept or reject.

Guiding principle: **AI should explain and suggest, not silently decide.**
The operator always sees the reasoning and remains in control of the allocation.

---

## 6. Implementation Phases

Phases are ordered so each one delivers standalone value and unblocks the next.

### Phase 1 — Expenses Foundation

**Status: Implemented** (branch `feat/expenses-foundation`)

Location: **Financials → Expenses**

Capture business expenses so estimated profit and available cash become accurate.

Fields:

- Date
- Amount
- Category
- Notes
- Receipt attachment (optional, deferred to a later iteration)

Categories: Shipping, Supplies, Software, Travel, Equipment, Other.

Why first: expenses are the last major missing _input_. Without them, every
downstream cash and owner-draw suggestion is overstated.

### Phase 2 — Financial Strategy Page

**Status: Implemented** (branch `feat/expenses-foundation`)

Location: **Financials → Strategy**

Let the operator choose how money should be allocated.

- Selected strategy preset
- Tax reserve %
- Reinvestment target %
- Cash buffer target
- Custom option (override the three levers)

This introduces the **Strategy settings** layer from the Core Model.

### Phase 3 — Financials Overview / Decision Center

Location: **Financials → Overview** (route `/admin/financials`, the Financials landing page)

**Status: Implemented (V1)** (branch `feat/expenses-foundation`)

Phase 3 ships in steps. **V1 (implemented)** is the decision-support Overview surface.
**Phase 3B (implemented)** adds manual business-wide cash snapshots. Estimated current
cash from snapshot + tracked events and the recommendation engine remain deferred.

**V1 Overview (implemented):**

- **Financial Snapshot** cards from existing data:
  - Owed to wholesalers (sum of wholesaler `balance_owed`)
  - Inventory spend — last 30 days (`GET /admin/inventory-invested?days=30`)
  - Business expenses — last 30 days (`GET /admin/business-expenses-total?days=30`)
  - Current strategy (label)
- **Strategy Preview**, **Decision Preview**, **What's Missing** — as above.

**Phase 3B — Manual cash snapshots (implemented):**

- `cash_snapshots` table; `source = MANUAL` only in V1 (one business-wide total).
- `GET /cash-snapshots/latest` — most recent snapshot, or `null`.
- `POST /cash-snapshots` — record a new reconciliation snapshot.
- **Cash Position** section on Overview — add / reconcile snapshot.

**Phase 4 — Recommendation Engine V1 (implemented):**

- `GET /financial-recommendations` — deterministic advisor output from latest snapshot + strategy.
- **Recommendation Summary** on Overview — current cash, tax reserve, cash buffer, reinvestment, safe owner draw.
- Confidence from snapshot age (High 0–14d, Medium 15–45d, Low 46+d).
- Advisor only — never creates owner draws or moves money.

**Still deferred:**

- Event-adjusted estimated current cash (snapshot + tracked inflows/outflows)
- Deeper recommendation explanations (formula breakdown per line)

### Phase 5 — Recommendation Explanations

Deepen trust in the numbers.

- Explain _why_ each recommendation was calculated
- Show the formula and the specific inputs used
- **No AI required** — this is transparent, deterministic explanation

Example: "Owner draw of $X = Available cash ($Y) − Reinvestment target ($Z),
where Available cash = Current estimated cash − Tax reserve ($T) − Cash buffer ($B)."

### Phase 6 — Smarter Analytics / AI (Later)

Only after enough real data exists.

- Platform profitability
- Inventory category performance
- Supplier performance
- AI-assisted recommendations (V2/V3 above)
- Customer returns/refunds — **only if** they become a meaningful profit leak

---

## 7. Non-Goals

To protect focus, the following are explicitly **not** being built:

- Tax filing
- An accounting replacement
- A QuickBooks clone
- Forecasting first (collect data before predicting)
- Advanced analytics before enough data exists
- Customer returns/refunds tracking until it is a proven profit leak
- AI decision making before a working manual strategy exists

If a proposed feature matches this list, it should be deferred or re-scoped.

---

## 8. Data Dependencies

### Already exists

- Shows
- Payouts
- Settlements
- Payments
- Balances
- Inventory purchases (with enrichment: supplier, category, type)
- Show timing
- Platform fee
- Owner activity

### Implementation status

**Implemented (Phases 1–4):**

- Business expenses (`business_expenses`)
- Strategy settings (`financial_strategy_settings`)
- Manual cash snapshots (`cash_snapshots`)
- Financials Overview (`/admin/financials`)
- Recommendation Engine V1 (`GET /financial-recommendations`) — uses snapshot
  amount × strategy; advisor only, no writes

**Still deferred:**

- Event-adjusted estimated current cash (snapshot + tracked cash events)
- Recommendation formula explanations (Phase 5)
- Bank integrations and multi-account cash feeds

### Current Cash Strategy (V1)

See **§3 Financial Concepts → Current Cash Strategy (V1)** for the full model.
In short: one business-wide manual snapshot as reconciliation anchor, estimated
cash derived from directional cash events, with last reconciliation date and
snapshot source surfaced in Overview.

### Future Cash Sources

See **§3 Financial Concepts → Future Cash Sources**. Bank integrations are
deferred; when added, they feed the same abstract snapshot model without
changing recommendation logic.

---

## 9. Branch and merge notes

Phases 1–4 were implemented on **`feat/expenses-foundation`**. Inventory enrichment,
show timing, and platform fee capture landed via earlier merges (see commit history).
The Decision Center foundation (expenses, strategy, overview, snapshots,
recommendations) ships together — migrations and UI are interdependent.

**Next:** Phase 5 — Recommendation Explanations (formula breakdown per line).
Event-adjusted estimated cash remains deferred.

---

## Open Questions

These do not block Phase 1 but should be resolved before Phases 2–3:

1. **Snapshot period** — Is estimated profit / inventory spend computed
   year-to-date, trailing 12 months, or a user-selected range? This affects tax
   reserve sizing.
2. **Cash snapshot granularity (V1 resolved)** — One business-wide cash snapshot.
   The operator records a single total business cash amount. No per-account
   tracking in V1 (no checking/savings/PayPal/Venmo breakdown).

   **Rationale:** simplest operator experience, lowest implementation complexity,
   and a model that supports future bank integrations and multi-account tracking
   without changing recommendation logic.

   **Future:** multiple accounts, account-level reconciliation, and bank-linked
   balances may be added later. Recommendation logic continues to operate on a
   business-wide cash position.

3. **Tax reserve model** — Flat % of estimated profit for V1, or tiered? Is it
   tracked as a running reserve balance or recomputed each view?
4. **Strategy scope** — One global strategy per business, or can it vary by
   period? V1 likely global; confirm.
5. **Reinvestment vs. inventory budget** — Are these the same lever or distinct?
   The model treats reinvestment target as the policy and inventory budget as a
   derived suggestion; confirm that framing.
6. **Owner activity reconciliation** — Should suggested owner draw compare against
   actual owner activity already recorded (e.g. "you've drawn $X of a suggested
   $Y")?
7. **Cash buffer definition** — Fixed dollar amount, or a function of recent
   expenses (e.g. N months of operating costs)?
8. **Cash snapshot reconciliation cadence** — How often should operators reconcile
   cash snapshots?
   - Monthly
   - Weekly
   - User-defined

   **Current recommendation:** monthly reconciliation reminders. Weekly or
   user-defined cadence can follow if operators need tighter control before bank
   integrations exist.

---

## Recommended Next Implementation Phase

**Phase 5 — Recommendation Explanations** (formula breakdown per line on Overview).

Recommendation Engine V1 (Phase 4) is implemented. Next: show how each number was
derived from snapshot + strategy inputs. Event-adjusted estimated cash remains deferred.
