"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORKFLOW_EMPTY_EXPENSES_HINT,
  WORKFLOW_EMPTY_EXPENSES_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  fetchBusinessExpenses,
  fetchBusinessExpensesTotal,
  createBusinessExpense,
  type BusinessExpenseDTO,
} from "@/src/lib/api/business-expenses";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { FinancialsCrossLinks } from "@/app/(admin)/admin/_components/FinancialsCrossLinks";
import { FINANCIALS_OVERVIEW_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { EXPENSE_CATEGORIES } from "@/src/lib/constants/expenses";
import {
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceActionCompleteMd,
  workspaceCard,
  workspaceDateInput,
  workspaceFormLabel,
  workspaceFormLabelSecondary,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTextInput,
  workspaceTheadSticky,
  workspaceTableRowInteractive,
} from "@/app/(admin)/admin/_components/workspaceUi";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<BusinessExpenseDTO[] | null>(null);
  const [expensesTotal, setExpensesTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchBusinessExpenses(30), fetchBusinessExpensesTotal(30)])
      .then(([rows, totalResponse]) => {
        if (!cancelled) {
          setExpenses(rows);
          setExpensesTotal(parseAmount(totalResponse.total));
        }
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
  }, [reloadToken]);

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
      setReloadToken((t) => t + 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminWorkspacePageLayout
      intro={
        <AdminWorkspacePageIntro
          title="Expenses"
          subtitle="Record business expenses now. They help future profit and cash recommendations stay accurate. Current recommendations are based on your latest cash snapshot."
        />
      }
    >
      <FinancialsCrossLinks
        className="mb-6"
        links={[
          {
            href: FINANCIALS_OVERVIEW_HREF,
            label: "View recommendation",
          },
        ]}
      />
      <section className={`mb-8 p-4 sm:p-5 ${workspaceCard}`}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Record expense
        </h2>
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
            <span className={`mb-1.5 block ${workspaceFormLabel}`}>
              Amount ($)
            </span>
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
            <span className={`mb-1.5 block ${workspaceFormLabel}`}>
              Category
            </span>
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
              {submitting ? "Saving…" : "Record expense"}
            </button>
          </div>
        </form>
        {submitError ? (
          <p className="mt-3 text-sm text-amber-700" role="alert">
            {submitError}
          </p>
        ) : null}
      </section>

      <section className={`min-w-0 overflow-hidden ${workspaceCard}`}>
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent expenses (last 30 days)
            </h2>
            {expensesTotal != null && !loading && !error ? (
              <p className="text-sm text-gray-600">
                Total:{" "}
                <span className="font-semibold tabular-nums text-gray-900">
                  {formatCurrency(expensesTotal)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500 sm:px-5">
            Loading…
          </div>
        ) : error ? (
          <WorkspaceInlineError
            title="Could not load recent expenses."
            message={error}
            onRetry={() => setReloadToken((t) => t + 1)}
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
        ) : (
          <>
            <div className="md:hidden">
              <ul className="divide-y divide-gray-100">
                {expenses.map((row) => (
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
                <thead className={workspaceTheadSticky}>
                  <tr>
                    <th
                      className={`${workspaceTableHeaderCellPadding} text-left`}
                    >
                      Date
                    </th>
                    <th
                      className={`${workspaceTableHeaderCellPadding} text-right`}
                    >
                      Amount
                    </th>
                    <th
                      className={`${workspaceTableHeaderCellPadding} text-left`}
                    >
                      Category
                    </th>
                    <th
                      className={`${workspaceTableHeaderCellPadding} text-left`}
                    >
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {expenses.map((row) => (
                    <tr key={row.id} className={workspaceTableRowInteractive}>
                      <td
                        className={`whitespace-nowrap text-sm text-gray-900 ${workspaceTableBodyCellPadding}`}
                      >
                        {formatDate(row.expense_date)}
                      </td>
                      <td
                        className={`whitespace-nowrap text-right text-sm text-gray-900 ${workspaceTableBodyCellPadding}`}
                      >
                        {formatCurrency(parseAmount(row.amount))}
                      </td>
                      <td
                        className={`whitespace-nowrap text-sm text-gray-600 ${workspaceTableBodyCellPadding}`}
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
      </section>
    </AdminWorkspacePageLayout>
  );
}
