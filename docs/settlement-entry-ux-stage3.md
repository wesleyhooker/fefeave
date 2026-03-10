# Settlement Entry UX — Stage 3 (Zero-Math Direction)

**Branch:** same as UX refinement (single branch)  
**Status:** First step implemented; target state documented.

---

## Options considered

### A) Industry-standard: lightweight settlement form

- Single-row form: one wholesaler, one deal type (percent or flat), one value.
- Add one settlement at a time; list grows below.
- Minimal UI surface; familiar pattern for CRUD forms.
- **Cognitive load:** Low per action; repeated use for many wholesalers.
- **Operator speed:** More clicks when many wholesalers (add, fill, add, fill).
- **Finance-data fit:** Good for simple one-off entries; weaker when deal types vary (percent vs flat vs qty×price).

### B) Felicia-first: structured settlement grid

- Multiple rows in a grid: wholesaler, deal type (percent / flat / qty×unit price), inputs; software calculates each line and shows totals.
- Add/remove rows; single “Save all” or per-row save.
- Supports variable wholesaler behavior (percent, flat, quantity×unit without SKU).
- **Cognitive load:** Slightly higher upfront (more columns); lower when batching many entries.
- **Operator speed:** Fewer round-trips; scan and fill in one place.
- **Finance-data fit:** Strong for structured finance data; tables/grids match how Felicia thinks about show → wholesalers → amounts.

---

## Recommendation

**Felicia-first direction** with a **phased first step**:

1. **Implemented in this pass:** Enhanced single-row form with three deal types and software-calculated amounts:
   - **Percent of payout** — Felicia enters percent; software calculates amount from show payout.
   - **Flat amount** — Felicia enters the amount (unchanged).
   - **Quantity × unit price** — Felicia enters quantity and unit price; software calculates total and stores as one MANUAL settlement (no backend change).
2. Labels and helpers stress “software calculates” to reinforce zero-math.
3. No SKU catalog; quantity×unit is for repeated items where Felicia knows qty and price.

**Why this first step:** Matches product direction (Felicia enters facts; software does math), supports all three real-world deal types without backend changes, and sets the pattern for a future grid (same three types, multiple rows).

---

## Cognitive load / operator speed / finance-data fit

| Criterion        | Industry form (A)    | Felicia-first grid (B)  | Implemented first step                           |
| ---------------- | -------------------- | ----------------------- | ------------------------------------------------ |
| Cognitive load   | Low per add          | Moderate (grid columns) | Low; one row, clear deal type                    |
| Operator speed   | More clicks for many | Fewer for batch         | One row at a time; faster than before (qty×unit) |
| Finance-data fit | OK for simple        | Strong (table/grid)     | Good; structured labels and calc preview         |

---

## Target state (future)

- **Full grid:** Multiple settlement rows in one view; add/remove rows; deal type per row (percent / flat / qty×unit); software-calculated totals and show-level profit preview.
- **Backend (optional):** Dedicated `QTY_UNIT` or line-item audit for quantity×unit (today we send computed amount as MANUAL).
- **No SKU management** in scope; quantity×unit remains “qty + unit price” only.
