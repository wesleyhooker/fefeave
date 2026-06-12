"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORKFLOW_EMPTY_EXPENSES_HINT,
  WORKFLOW_EMPTY_EXPENSES_TITLE,
  WORKFLOW_PURCHASES_RECORD_EXPENSE_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { PURCHASES_EXPENSES_HISTORY_HREF } from "@/app/(admin)/admin/purchases/purchasesLedgerLinks";
import { PurchasesViewHistoryLink } from "@/app/(admin)/admin/purchases/PurchasesViewHistoryLink";
import {
  fetchBusinessExpenses,
  createBusinessExpense,
  type BusinessExpenseDTO,
} from "@/src/lib/api/business-expenses";
import {
  WorkspaceCard,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { EXPENSE_CATEGORIES } from "@/src/lib/constants/expenses";
import {
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceActionCompleteMd,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTextInput,
  workspaceTheadSticky,
  workspaceTableRowInteractive,
  workspaceTableTheadFinancial,
} from "@/app/(admin)/admin/_components/workspaceUi";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type ExpenseSortKey = "expense_date" | "amount" | "category";

const thBtn =
  "inline-flex max-w-full items-center gap-0.5 text-left font-medium text-gray-600 transition-colors hover:text-gray-900";
const thBtnRight = `${thBtn} w-full justify-end text-right`;

function matchesExpenseSearch(row: BusinessExpenseDTO, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [row.expense_date, row.amount, row.category, row.notes ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function RecordExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amt = amount === "" ? NaN : Number(amount);
    if (!expenseDate.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    if (!category) {
      setSubmitError("Category is required.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setSubmitError("Amount must be greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await createBusinessExpense({
        expense_date: expenseDate.trim(),
        amount: amt,
        category,
        notes: notes.trim() || undefined,
      });
      setExpenseDate("");
      setAmount("");
      setCategory("");
      setNotes("");
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabel}`}>Date</span>
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className={`w-full min-w-0 ${workspaceDateInput}`}
        />
      </label>
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabel}`}>Amount ($)</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full min-w-0 max-w-full sm:max-w-[12rem] ${workspaceTextInput}`}
          inputMode="decimal"
        />
      </label>
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabel}`}>Category</span>
        <WorkspaceNativeSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Expense category"
        >
          <option value="">Select category</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </WorkspaceNativeSelect>
      </label>
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
          Notes (optional)
        </span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Shipping labels for March shows"
          className={`w-full min-w-0 ${workspaceTextInput}`}
        />
      </label>
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-50 sm:w-auto`}
        >
          {submitting ? "Saving…" : WORKFLOW_PURCHASES_RECORD_EXPENSE_LABEL}
        </button>
      </div>
      {submitError ? (
        <p className="text-sm text-amber-700" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}

export function ExpensesActivityPanel({
  reloadToken,
  search = "",
  categoryFilter = "",
}: {
  reloadToken?: number;
  search?: string;
  categoryFilter?: string;
}) {
  const [expenses, setExpenses] = useState<BusinessExpenseDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localReloadToken, setLocalReloadToken] = useState(0);
  const [sortKey, setSortKey] = useState<ExpenseSortKey>("expense_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBusinessExpenses(30)
      .then((rows) => {
        if (!cancelled) setExpenses(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setExpenses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, localReloadToken]);

  const filtered = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((row) => {
      if (categoryFilter && row.category !== categoryFilter) return false;
      return matchesExpenseSearch(row, search);
    });
  }, [expenses, search, categoryFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "expense_date":
          cmp = a.expense_date.localeCompare(b.expense_date);
          break;
        case "amount":
          cmp = parseAmount(a.amount) - parseAmount(b.amount);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: ExpenseSortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "expense_date" || key === "amount" ? "desc" : "asc");
    }
  };

  const SortIndicator = ({ column }: { column: ExpenseSortKey }) =>
    sortKey === column ? (
      <span className="text-gray-400" aria-hidden>
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    ) : null;

  const mobileSortValue = `${sortKey}:${sortDir}`;
  const handleMobileSort = (raw: string) => {
    const i = raw.lastIndexOf(":");
    if (i <= 0) return;
    const key = raw.slice(0, i) as ExpenseSortKey;
    const dir = raw.slice(i + 1);
    if (dir !== "asc" && dir !== "desc") return;
    if (key === "expense_date" || key === "amount" || key === "category") {
      setSortKey(key);
      setSortDir(dir);
    }
  };

  const hasFilters = search.trim().length > 0 || categoryFilter.length > 0;

  return (
    <WorkspaceCard>
      <WorkspaceCardHeader
        className="border-gray-100 px-4 py-3 sm:px-5"
        toolbar
        title="Recent expenses (last 30 days)"
        titleClassName="text-lg font-semibold text-gray-900"
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!loading && !error && expenses?.length ? (
              <p className="text-xs font-medium text-gray-500">
                {sorted.length === expenses.length
                  ? `${expenses.length} events`
                  : `${sorted.length} of ${expenses.length} events`}
              </p>
            ) : null}
            <PurchasesViewHistoryLink href={PURCHASES_EXPENSES_HISTORY_HREF} />
          </div>
        }
      />
      {loading ? (
        <div className="px-4 py-6 text-sm text-gray-500 sm:px-5">Loading…</div>
      ) : error ? (
        <WorkspaceInlineError
          title="Could not load recent expenses."
          message={error}
          onRetry={() => setLocalReloadToken((t) => t + 1)}
          className="m-4"
        />
      ) : !expenses?.length ? (
        <div className="px-4 py-6 text-center sm:px-5">
          <p className="text-sm font-medium text-gray-600">
            {WORKFLOW_EMPTY_EXPENSES_TITLE}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {WORKFLOW_EMPTY_EXPENSES_HINT}
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-4 py-6 text-center sm:px-5">
          <p className="text-sm font-medium text-gray-600">
            No expenses match your search
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {hasFilters
              ? "Try a different search term or clear filters."
              : WORKFLOW_EMPTY_EXPENSES_HINT}
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-gray-100 bg-gray-50/30 px-4 py-3 md:hidden">
            <label className="block min-w-0">
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                Sort list
              </span>
              <WorkspaceNativeSelect
                value={mobileSortValue}
                onChange={(e) => handleMobileSort(e.target.value)}
                aria-label="Sort expense list"
              >
                <option value="expense_date:desc">Date (newest first)</option>
                <option value="expense_date:asc">Date (oldest first)</option>
                <option value="amount:desc">Amount (highest first)</option>
                <option value="amount:asc">Amount (lowest first)</option>
                <option value="category:asc">Category (A–Z)</option>
                <option value="category:desc">Category (Z–A)</option>
              </WorkspaceNativeSelect>
            </label>
          </div>
          <div className="md:hidden">
            <ul className="divide-y divide-gray-100">
              {sorted.map((row) => (
                <li key={row.id} className="min-w-0 px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span
                      className={`text-lg font-semibold tabular-nums text-gray-900 ${workspaceMoneyTabular}`}
                    >
                      {formatCurrency(parseAmount(row.amount))}
                    </span>
                    <span className={`text-sm ${workspaceTableCellMeta}`}>
                      {formatDate(row.expense_date)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-gray-600">
                    {row.category}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-gray-700">
                    {row.notes?.trim() ? row.notes : "—"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-100">
              <thead
                className={`${workspaceTheadSticky} ${workspaceTableTheadFinancial}`}
              >
                <tr>
                  <th
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("expense_date")}
                      className={`${thBtn} min-w-0`}
                    >
                      Date
                      <SortIndicator column="expense_date" />
                    </button>
                  </th>
                  <th
                    className={`${workspaceTableHeaderCellPadding} text-right`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("amount")}
                      className={thBtnRight}
                    >
                      Amount
                      <SortIndicator column="amount" />
                    </button>
                  </th>
                  <th
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("category")}
                      className={`${thBtn} min-w-0`}
                    >
                      Category
                      <SortIndicator column="category" />
                    </button>
                  </th>
                  <th
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    <span className="font-medium text-stone-700">Notes</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sorted.map((row) => (
                  <tr key={row.id} className={workspaceTableRowInteractive}>
                    <td
                      className={`whitespace-nowrap text-sm font-medium text-stone-900 ${workspaceTableBodyCellPadding}`}
                    >
                      {formatDate(row.expense_date)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right text-sm font-semibold text-stone-900 ${workspaceTableBodyCellPadding} ${workspaceMoneyTabular}`}
                    >
                      {formatCurrency(parseAmount(row.amount))}
                    </td>
                    <td
                      className={`whitespace-nowrap text-sm font-medium text-stone-700 ${workspaceTableBodyCellPadding}`}
                    >
                      {row.category}
                    </td>
                    <td
                      className={`text-sm text-gray-600 ${workspaceTableBodyCellPadding}`}
                    >
                      {row.notes?.trim() ? (
                        row.notes
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </WorkspaceCard>
  );
}

/** @deprecated Use Purchases workspace panels instead. */
export function ExpensesTabPanel() {
  return <ExpensesActivityPanel />;
}
