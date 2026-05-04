"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchInventoryPurchases,
  createInventoryPurchase,
  type InventoryPurchaseDTO,
} from "@/src/lib/api/inventory-purchases";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
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

export default function AdminInventoryPage() {
  const [purchases, setPurchases] = useState<InventoryPurchaseDTO[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [purchaseDate, setPurchaseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInventoryPurchases(30)
      .then((rows) => {
        if (!cancelled) setPurchases(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setPurchases([]);
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
    if (!purchaseDate.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setSubmitError("Amount must be greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await createInventoryPurchase({
        purchase_date: purchaseDate.trim(),
        amount: amt,
        notes: notes.trim() || undefined,
      });
      setPurchaseDate("");
      setAmount("");
      setNotes("");
      setReloadToken((t) => t + 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminPageIntroSection>
        <AdminPageIntro
          title="Inventory purchases"
          subtitle="Record pallet or lump-sum inventory buys (cash-based, no SKU)."
          action={
            <Link
              href="/admin/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Dashboard
            </Link>
          }
        />
      </AdminPageIntroSection>
      <AdminPageContainer>
        <section className={`mb-8 p-4 sm:p-5 ${workspaceCard}`}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Add purchase
          </h2>
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
            <label className="block min-w-0">
              <span className={`mb-1.5 block ${workspaceFormLabel}`}>Date</span>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
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
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                Notes (optional)
              </span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pallet #3"
                className={`w-full min-w-0 ${workspaceTextInput}`}
              />
            </label>
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className={`${workspaceActionCompleteMd} w-full justify-center disabled:opacity-50 sm:w-auto`}
              >
                {submitting ? "Saving…" : "Add purchase"}
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
            <h2 className="text-lg font-semibold text-gray-900">
              Recent purchases (last 30 days)
            </h2>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-sm text-gray-500 sm:px-5">
              Loading…
            </div>
          ) : error ? (
            <WorkspaceInlineError
              title="Could not load recent purchases."
              message={error}
              onRetry={() => setReloadToken((t) => t + 1)}
              className="m-4"
            />
          ) : !purchases?.length ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500 sm:px-5">
              No purchases in the last 30 days.
            </div>
          ) : (
            <>
              <div className="md:hidden">
                <ul className="divide-y divide-gray-100">
                  {purchases.map((row) => (
                    <li key={row.id} className="min-w-0 px-4 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span
                          className={`text-lg font-semibold tabular-nums text-gray-900 ${workspaceMoneyTabular}`}
                        >
                          {formatCurrency(parseAmount(row.amount))}
                        </span>
                        <span className={`text-sm ${workspaceTableCellMeta}`}>
                          {formatDate(row.purchase_date)}
                        </span>
                      </div>
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
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {purchases.map((row) => (
                      <tr key={row.id} className={workspaceTableRowInteractive}>
                        <td
                          className={`whitespace-nowrap text-sm text-gray-900 ${workspaceTableBodyCellPadding}`}
                        >
                          {formatDate(row.purchase_date)}
                        </td>
                        <td
                          className={`whitespace-nowrap text-right text-sm text-gray-900 ${workspaceTableBodyCellPadding}`}
                        >
                          {formatCurrency(parseAmount(row.amount))}
                        </td>
                        <td
                          className={`text-sm text-gray-600 ${workspaceTableBodyCellPadding}`}
                        >
                          {row.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </AdminPageContainer>
    </>
  );
}
