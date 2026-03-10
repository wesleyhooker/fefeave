# Manual QA: Itemized settlements and settlement flows

Use this checklist to validate ITEMIZED settlements and confirm PERCENT/MANUAL and balances are unchanged.

## Prerequisites

- At least one wholesaler exists.
- Backend and frontend running; you can create shows and add financials.

---

## 1. Create itemized settlement

1. Go to **Admin** → **Shows** → open a show (or create one and land on detail).
2. Ensure **Payout after fees** is saved (any value).
3. In the **Settlements** table, in the add row:
   - **Wholesaler:** Select a wholesaler.
   - **Deal type:** Choose **Qty × unit price**.
4. Confirm the form shows **Itemized lines** with one empty line (item name, qty, unit price $).
5. Fill one line: e.g. **Item name** `New Balance 550`, **Qty** `6`, **Unit $** `60`.
6. Confirm **line total** shows `$360.00` (6 × 60).
7. Click **+ Add line**, add a second line: **Crewneck**, **3**, **25**.
8. Confirm second line total is `$75.00` and **Total settlement = $435.00**.
9. Click **Add row**.
10. Confirm the new settlement row appears in the table with **Deal type** “Itemized” and **Total** `$435.00`.

---

## 2. Multiple lines and total preview

1. With **Qty × unit price** selected, add 2–3 lines with different qty and unit prices.
2. Change qty or unit price on one line; confirm that line’s total and **Total settlement** update.
3. Remove a line with **Remove**; confirm **Total settlement** recalculates.
4. Confirm **Add row** is disabled when there are no lines or any line is invalid (e.g. empty item name, qty ≤ 0).

---

## 3. Saved settlement on show detail

1. After adding an itemized settlement, reload the show detail page (or navigate away and back).
2. Confirm the itemized settlement still appears with **Deal type** “Itemized” and the correct total.
3. Confirm other settlement types (Percent, Flat) still show as “Percent” and “Flat” with correct amounts.

---

## 4. Balances reflect itemized total

1. Go to **Admin** → **Balances** (or **Home** and use the Balances link).
2. Find the wholesaler you used for the itemized settlement.
3. Confirm **Owed total** (and **Balance owed** if no payments) includes the itemized settlement total (e.g. $435).
4. Optionally click **Refresh** and confirm numbers do not change (data already correct).

---

## 5. Wholesaler detail / statement

1. Go to **Admin** → **Wholesalers** → open that wholesaler.
2. Confirm **Current balance** matches the expected balance (includes itemized total).
3. In **Statement (ledger)**, confirm there is an **OWED** (Settlement) entry with the itemized total amount.
4. Confirm **Record Payment** works and that after recording a payment you are redirected back to wholesaler detail and the balance updates.

---

## 6. Flat and percent flows still work

1. **Flat:** On a show detail, add a settlement with **Deal type** “Flat amount ($)”, enter e.g. `100`, submit. Confirm the row appears with total `$100.00` and balances update.
2. **Percent:** Ensure the show has **Payout after fees** saved (e.g. `10000`). Add a settlement **Deal type** “Percent of payout”, enter e.g. `25`, confirm preview “25% of $10,000 = $2,500”, submit. Confirm the row shows 25% and $2,500 and balances update.
3. Confirm **Deal type** “Percent of payout” shows “Save payout above first” and disables **Add row** when payout is 0.

---

## Sign-off

| Step                               | Pass / Fail |
| ---------------------------------- | ----------- |
| 1. Create itemized settlement      |             |
| 2. Multiple lines & preview        |             |
| 3. Saved settlement on show detail |             |
| 4. Balances reflect total          |             |
| 5. Wholesaler detail / statement   |             |
| 6. Flat and percent flows          |             |
