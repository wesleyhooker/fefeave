# FefeAve Financials Vision (V2)

Status: Draft
Last Updated: 2026-05-28

## Purpose

This document defines the long-term vision for FefeAve.

It is not a roadmap, implementation plan, or commitment to future features.

Its purpose is to ensure that product decisions, database design, UI improvements, and future reporting capabilities move toward a consistent destination.

Whenever a new feature, field, report, or workflow is considered, it should be evaluated against this document.

## Product Vision

FefeAve begins as a financial operations platform.

Its initial responsibility is replacing spreadsheets used to manage:

- Shows
- Settlements
- Wholesaler balances
- Payments
- Inventory purchases

Over time, FefeAve evolves into a financial decision-making platform.

The long-term goal is not simply tracking money.

The goal is helping the business answer:

- How much money was made?
- How much is owed?
- How much inventory was purchased?
- How much should be reserved for taxes?
- How much should be reinvested?
- How much can safely be paid to the owner?

## Core Product Pillars

The application consists of two primary workspaces.

### 1. Shows

Operational workflow for live selling events.

Responsibilities:

- Create shows
- Track payouts
- Manage settlements
- Estimate profit
- Close shows
- Maintain show history

### 2. Financials

Financial source of truth for the business.

Responsibilities:

- Track balances
- Record payments
- Manage accounts
- Track owner activity
- Track inventory purchases
- Support future financial planning

Every future feature should naturally belong to either:

- Shows
- Financials

If a feature does not clearly fit one of those workspaces, its purpose should be reevaluated.

## Financials Information Architecture

### Current

Financials

- Balances
- Payments
- Accounts
- Owner Activity
- Inventory

Overview is planned under **Future** below; it is not a sidebar child until a dedicated page exists.

### Future

Financials

#### Overview

- Snapshot
- Action Center
- Cash Position

#### Operations

- Balances
- Payments
- Accounts
- Owner Activity
- Inventory

#### Planning

- Profit
- Taxes
- Reinvestment
- Reports

## Product Evolution

### Current State

Shows

→ Settlements

→ Payments

→ Balances

This stage focuses on bookkeeping accuracy and operational workflows.

### Future State

Shows

→ Settlements

→ Payments

→ Profit

Profit

→ Taxes

→ Reinvestment

→ Owner Draw

This stage focuses on business decision-making.

## Dashboard Philosophy

The dashboard should prioritize action over statistics.

The primary question should be:

"What needs attention today?"

Examples:

- Open shows requiring closure
- Outstanding wholesaler balances
- Missing inventory information
- Pending payments
- Reconciliation issues

The dashboard should answer:

"What should I do next?"

before answering:

"What happened?"

Statistics remain important, but they are secondary.

Actions first.

Statistics second.

## Design Philosophy

The strongest current design pattern is the Show Detail page.

It follows:

Working Area

-

Summary

-

Primary Action

Example:

- Payout
- Settlements
- Profit
- Close Show

Future pages should favor this structure whenever practical.

Users should be able to:

- Understand the situation
- See the important numbers
- Take the next action

without navigating elsewhere.

## Financial Model

### Current

Profit

= Payout

- Settlements

### Future

Operating Profit

= Revenue

- Settlements
- Inventory
- Platform Fees
- Business Expenses

Available Cash

= Operating Profit

- Tax Reserve

Recommended Owner Draw

= Available Cash

- Reinvestment Reserve

This model is intended to support planning, not accounting or tax preparation.

## Future Business Questions

These questions drive future data collection decisions.

### Show Performance

Questions:

- Which platform performs best?
- Which platform is most profitable?
- Which days perform best?
- What is average payout per show?
- What is average profit per show?
- Which shows produce the highest margins?
- Which shows produce the highest profit per hour?

Potential Data:

- Platform
- Show date
- Show duration
- Payout
- Fees
- Profit

### Inventory Performance

Questions:

- How much inventory is purchased each month?
- Which suppliers perform best?
- Which inventory categories perform best?
- Which purchase types perform best?
- Which inventory sources generate the highest ROI?

Potential Data:

- Supplier
- Purchase category
- Purchase type
- Purchase amount
- Purchase date

Example Categories:

- Clothing
- Shoes
- Accessories
- Mixed Inventory

Example Purchase Types:

- Pallet
- Shelf Pulls
- Liquidation
- Returned Merchandise
- Consignment

### Wholesaler Performance

Questions:

- Which wholesalers generate the most revenue?
- Which wholesalers generate the most profit?
- Which wholesalers maintain the largest balances?
- Which wholesalers are paid most consistently?
- Which wholesalers require the most follow-up?

Potential Data:

- Settlement totals
- Payment totals
- Payment timing
- Balance history

### Financial Planning

Questions:

- How much profit has been generated?
- How much cash is available?
- How much should be reserved for taxes?
- How much should be reinvested?
- How much can be paid as owner draw?
- How much cash is tied up in inventory?

Potential Data:

- Operating profit
- Inventory spending
- Tax reserves
- Reinvestment allocations
- Owner withdrawals

## Data Collection Philosophy

Collect data before building analytics.

Whenever a future business question is identified:

1. Determine whether the required data should begin being captured.
2. Store the information even if no reporting exists yet.
3. Avoid collecting data without a future purpose.

Before adding a field, ask:

"What future question will this help answer?"

Examples:

Platform

→ Which platform is most profitable?

Purchase Type

→ Which inventory sources perform best?

Supplier

→ Which suppliers generate the highest ROI?

Show Duration

→ Which shows generate the highest return per hour?

Storage is cheap.

Missing historical data is expensive.

## Analytics Philosophy

Analytics should be built only after sufficient historical data exists.

Avoid building:

- Trend reports
- Forecasting
- Recommendations
- Profit projections

until enough real-world data has been collected.

The system should first become a reliable source of truth.

Reporting and planning tools should be layered on top afterward.

## Explicit Non-Goals

FefeAve is not intended to become:

- A tax filing platform
- A bookkeeping replacement
- An accounting system
- A QuickBooks competitor
- A financial advisor
- An inventory forecasting platform

Its purpose is helping operators make informed business decisions using accurate operational data.

## Success Definition

FefeAve is successful when Felicia can reliably answer:

- How much money did I make?
- How much do I owe?
- How much inventory did I buy?
- How much cash do I currently have available?
- How much should I reserve for taxes?
- How much should I reinvest?
- How much can I safely pay myself?

without needing spreadsheets, manual calculations, or external tracking systems.
