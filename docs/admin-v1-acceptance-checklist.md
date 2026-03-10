# Admin V1 acceptance checklist

Use this checklist to verify the full financial workflow end-to-end before treating V1 as ready for real use.

## Prerequisites

- Backend and frontend running.
- At least one wholesaler exists.
- You are logged in as an admin (or operator).

---

## Steps

### 1. Create show

- [ ] Go to **Admin** → **Shows** → **New Show** (or equivalent).
- [ ] Enter show name, platform, date.
- [ ] Submit and confirm you are redirected to the show detail page.

### 2. Save payout after fees

- [ ] On the show detail page, enter **Payout after fees** (e.g. `10000`).
- [ ] Save and confirm the value persists on reload.

### 3. Add flat settlement

- [ ] In **Settlements**, add a row with **Deal type** “Flat amount ($)” and an amount (e.g. `100`).
- [ ] Submit and confirm the settlement appears with the correct total.

### 4. Add percent settlement

- [ ] Add another settlement with **Deal type** “Percent of payout” and a percentage (e.g. `25`).
- [ ] Confirm the preview shows the correct percentage of payout (e.g. 25% of $10,000 = $2,500).
- [ ] Submit and confirm the settlement appears with the correct amount.

### 5. Add itemized settlement

- [ ] Add a settlement with **Deal type** “Qty × unit price”.
- [ ] Add at least two lines (item name, quantity, unit price).
- [ ] Confirm line totals and **Total settlement** update correctly.
- [ ] Submit and confirm the itemized settlement appears with the correct total.

### 6. Verify balances update

- [ ] Go to **Admin** → **Balances** (or **Home** → Balances).
- [ ] Find the wholesaler(s) you used and confirm **Owed total** and **Balance owed** include the new settlements (flat + percent + itemized totals).

### 7. Open wholesaler detail

- [ ] From Balances, click the wholesaler name to open wholesaler detail.
- [ ] Confirm **Current balance** matches expectations and the **Statement** table shows OWED (Settlement) entries.

### 8. Expand itemized settlement lines

- [ ] In the Statement table, find an **OWED** row that is an itemized settlement.
- [ ] Click **Show lines** and confirm the breakdown (Item, Qty, Unit price, Line total) appears.
- [ ] Click **Hide lines** and confirm it collapses.

### 9. Record payment

- [ ] Click **Record payment** (or go to **Payments** → **Record payment** and select the wholesaler).
- [ ] Enter an amount less than or equal to the current balance and confirm **Current balance** and **After this payment** display correctly.
- [ ] Optionally enter an amount greater than the balance and confirm the overage warning appears (submission is not blocked).
- [ ] Submit a payment and confirm success (e.g. redirect to wholesaler detail or payments list).

### 10. Verify statement running balance

- [ ] On the wholesaler detail **Statement**, confirm the latest row shows a **PAYMENT** entry and the **Balance** column reflects the payment (reduced or zero).

### 11. Verify balances update after payment

- [ ] Go back to **Balances** and confirm the wholesaler’s **Balance owed** (and **Paid total** if shown) updated correctly after the payment.

### 12. Export balances CSV

- [ ] On the Balances page, click **Download Balances CSV** (and optionally set search/filter/sort).
- [ ] Confirm a CSV file downloads with expected columns (e.g. Wholesaler, Owed total, Paid total, Balance owed, Last payment date).

### 13. Export ledger CSV

- [ ] Open a wholesaler detail page.
- [ ] Click **Download Ledger CSV**.
- [ ] Confirm a CSV file downloads with transaction-level rows (e.g. Date, Wholesaler, Type, Show, Reference ID, Description, Amount) for that wholesaler (default: current year).

---

## Sign-off

| Step                                     | Pass / Fail |
| ---------------------------------------- | ----------- |
| 1. Create show                           |             |
| 2. Save payout after fees                |             |
| 3. Add flat settlement                   |             |
| 4. Add percent settlement                |             |
| 5. Add itemized settlement               |             |
| 6. Verify balances update                |             |
| 7. Open wholesaler detail                |             |
| 8. Expand itemized settlement lines      |             |
| 9. Record payment                        |             |
| 10. Verify statement running balance     |             |
| 11. Verify balances update after payment |             |
| 12. Export balances CSV                  |             |
| 13. Export ledger CSV                    |             |

**Date:** ******\_\_\_******  
**Tester:** ******\_\_\_******
