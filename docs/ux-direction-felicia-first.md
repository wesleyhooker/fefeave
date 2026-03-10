# FefeAve Admin UX Direction — Felicia-First

**Product owner:** Wesley  
**Status:** Direction memo; use for future admin UX work. Do not treat as a rigid template—support real operator workflow over generic SaaS patterns.

---

## Design principles (product direction)

1. **Felicia-first usability** beats generic admin conventions.
2. **Low cognitive load** beats feature density.
3. **Structured financial clarity** beats overly “cardy” layouts.
4. **Best practices** should support the product’s real use, not flatten it into template SaaS.
5. The interface should feel **clean, trustworthy, quick to scan, and visually calm**.

---

## How these principles shape each area

### Admin shell

- **Intent:** One coherent place to work; nav and headers stay predictable so operators don’t wonder where they are.
- **Felicia-first:** Stable sidebar + header on every admin route. “Home” = dashboard (real landing). Active nav state so the current section is obvious. Minimal chrome—no mega-menus or nested flyouts that add steps.
- **Avoid:** Multiple shells, disappearing nav, or a “home” that isn’t the dashboard. Don’t add sections or density just to match generic admin UIs.

### Dashboard

- **Intent:** Quick orientation and next actions, not a wall of widgets.
- **Felicia-first:** Clear grouping: quick actions, then financial snapshot (totals, cash view), then “who you owe” and recent activity. Use tables for “who you owe” and recent shows/payments—numbers and names scan better in rows. Cards only where they add clarity (e.g. summary totals or status), not for every block.
- **Avoid:** Card-heavy dashboards, decorative charts, or equal visual weight for everything. Prioritize what Felicia actually checks first.

### Shows detail / close-out flow

- **Intent:** Close a show with confidence: see what’s owed, by whom, and act (or defer) without cognitive overload.
- **Felicia-first:** Structured financial clarity: payout, settlements, and any “still to do” in a clear hierarchy. Tables for settlement lines (wholesaler, amount, status). One clear close-out path with guardrails (e.g. confirm before close), but flexible enough for variable wholesaler behavior (e.g. ad hoc vs scheduled).
- **Avoid:** Overengineered wizards or rigid steps that don’t match how shows actually close. Don’t hide numbers inside cards when a table or simple list is clearer.

### Wholesaler detail

- **Intent:** See who they are, what they’re owed, pay cadence, and statement history; get to “record payment” or “balance breakdown” without hunting.
- **Felicia-first:** Identity and cadence up top; statement and balance breakdown in tables/grids. Batch-pay view should make “what am I paying for?” obvious—structured by show/obligation, not buried in cards.
- **Avoid:** Treating every block as a card. Avoid hiding financial detail behind tabs or accordions when a single scrollable table is faster to scan.

### Balances / payments views

- **Intent:** Know who owes what, what’s been paid, and record new payments quickly.
- **Felicia-first:** Balances = table-first (wholesaler, amounts, last paid, actions). Payments list = table (date, amount, reference, link to wholesaler). “Record payment” = focused form, not a multi-step funnel unless the data truly requires it. CSV/export where it helps real workflow (e.g. reconciliation).
- **Avoid:** Card grids for balance rows or payment history. Avoid splitting “balances” and “payments” into disconnected experiences when they’re part of the same mental model (who do I owe, what have I paid).

---

## Concrete design rules for future admin work

1. **Tables for financial and list data.** Use tables (or dense, scannable grids) for: balances, payment history, settlement lines, statement lines, show lists. Reserve cards for summaries, status blocks, or single-entity highlights.

2. **One clear “home” for admin.** `/admin` should land operators in the dashboard. Sidebar “Home” = dashboard. Don’t introduce a separate “overview” that competes with the dashboard.

3. **Stable shell, clear active state.** Every admin route uses the same sidebar and header. Nav item for the current section is always visually active. No collapsing sidebar or conditional chrome that changes by page.

4. **Group by meaning, not by component type.** Group content by task or concept (e.g. “Who you owe,” “Recent payments”) and use hierarchy (heading, then table or list). Don’t default to “everything in a card” for consistency.

5. **Respect variable wholesaler behavior.** Support both ad hoc and scheduled pay patterns. Don’t force a single rigid flow; allow quick actions (e.g. “Record payment”) from multiple entry points where it matches real use.

6. **Low density of controls.** Prefer fewer, clearer actions per view. Use links and buttons for primary actions; avoid burying actions in overflow menus unless the list is long and secondary.

7. **Calm, scannable visuals.** Sufficient contrast and spacing; avoid noisy borders or competing accents. Use typography and alignment to create hierarchy; use color sparingly (e.g. status, alerts).

8. **When proposing UX changes:** Always give (1) the industry-standard option, (2) the Felicia-first option, (3) a recommendation with short rationale, plus impact on cognitive load, operator speed, and whether the pattern suits structured finance data vs general navigation.

---

## Proposal format for future UX changes

When suggesting UX changes, include:

| Element               | Content                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Industry standard** | What generic SaaS or admin UIs typically do.                                                                   |
| **Felicia-first**     | What better matches Felicia’s workflow and the principles above.                                               |
| **Recommendation**    | Which option (and why in 1–2 sentences).                                                                       |
| **Cognitive load**    | Does it reduce or increase decisions and visual noise?                                                         |
| **Operator speed**    | Does it reduce clicks, scroll, or search time?                                                                 |
| **Data type**         | Better for structured finance data (tables, numbers, dates) vs general navigation (menus, breadcrumbs, links). |

Do not implement the next major UX pass until this direction has been reviewed and any adjustments agreed.
