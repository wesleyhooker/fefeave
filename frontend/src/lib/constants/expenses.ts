/** Allowed business expense categories — keep in sync with backend/src/constants/expenses.ts */
export const EXPENSE_CATEGORIES = [
  'Shipping',
  'Supplies',
  'Software',
  'Travel',
  'Equipment',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
