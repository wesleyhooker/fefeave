/** Allowed business expense categories (Phase 1 — Financial Decision Center). */
export const EXPENSE_CATEGORIES = [
  'Shipping',
  'Supplies',
  'Software',
  'Travel',
  'Equipment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
