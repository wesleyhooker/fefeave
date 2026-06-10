"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORKFLOW_EMPTY_INVENTORY_HINT,
  WORKFLOW_EMPTY_INVENTORY_TITLE,
  WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR,
  WORKFLOW_PURCHASES_PAYMENT_PAID_NOW,
  WORKFLOW_PURCHASES_INVENTORY_RECENT_TITLE,
  WORKFLOW_PURCHASES_RECORD_INVENTORY_LABEL,
  WORKFLOW_PURCHASES_VENDOR_REQUIRED,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import {
  buildVendorNameLookup,
  resolveSupplierVendorId,
} from "@/app/(admin)/admin/purchases/matchSupplierToVendor";
import { PURCHASES_INVENTORY_HISTORY_HREF } from "@/app/(admin)/admin/purchases/purchasesLedgerLinks";
import { PurchasesViewHistoryLink } from "@/app/(admin)/admin/purchases/PurchasesViewHistoryLink";
import {
  fetchInventoryPurchases,
  createInventoryPurchase,
  type InventoryPaymentStatus,
  type InventoryPurchaseDTO,
} from "@/src/lib/api/inventory-purchases";
import {
  WorkspaceCard,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_PURCHASE_TYPES,
} from "@/src/lib/constants/inventory";
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
  workspaceRowTitleLink,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type InventorySortKey =
  | "purchase_date"
  | "amount"
  | "category"
  | "purchase_type"
  | "supplier";

const thBtn =
  "inline-flex max-w-full items-center gap-0.5 text-left font-medium text-gray-600 transition-colors hover:text-gray-900";
const thBtnRight = `${thBtn} w-full justify-end text-right`;

function matchesInventorySearch(
  row: InventoryPurchaseDTO,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.purchase_date,
    row.amount,
    row.category ?? "",
    row.purchase_type ?? "",
    row.supplier ?? "",
    row.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function SupplierCell({
  supplier,
  vendorLookup,
}: {
  supplier?: string | null;
  vendorLookup: ReadonlyMap<string, string>;
}) {
  const trimmed = supplier?.trim();
  if (!trimmed) {
    return <span className="font-normal text-gray-400">—</span>;
  }
  const vendorId = resolveSupplierVendorId(trimmed, vendorLookup);
  if (vendorId) {
    return (
      <Link href={vendorDetailHref(vendorId)} className={workspaceRowTitleLink}>
        {trimmed}
      </Link>
    );
  }
  return trimmed;
}

function paymentStatusLabel(
  status: InventoryPaymentStatus | undefined,
): string {
  return status === "OWE_VENDOR"
    ? WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR
    : WORKFLOW_PURCHASES_PAYMENT_PAID_NOW;
}

export function RecordInventoryPurchaseForm({
  onSuccess,
  initialWholesalerId,
  initialPaymentStatus,
}: {
  onSuccess?: () => void;
  initialWholesalerId?: string;
  initialPaymentStatus?: InventoryPaymentStatus;
}) {
  const [purchaseDate, setPurchaseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState("");
  const [purchaseType, setPurchaseType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<InventoryPaymentStatus>(
    initialPaymentStatus ?? "PAID_NOW",
  );
  const [wholesalerId, setWholesalerId] = useState(initialWholesalerId ?? "");
  const [vendors, setVendors] = useState<
    Array<{ wholesaler_id: string; name: string }>
  >([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPaymentStatus != null) {
      setPaymentStatus(initialPaymentStatus);
    }
    if (initialWholesalerId != null) {
      setWholesalerId(initialWholesalerId);
    }
  }, [initialPaymentStatus, initialWholesalerId]);

  useEffect(() => {
    let cancelled = false;
    setVendorsLoading(true);
    fetchWholesalerBalances()
      .then((rows) => {
        if (cancelled) return;
        setVendors(
          [...rows]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((r) => ({ wholesaler_id: r.wholesaler_id, name: r.name })),
        );
      })
      .catch(() => {
        if (!cancelled) setVendors([]);
      })
      .finally(() => {
        if (!cancelled) setVendorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (paymentStatus === "OWE_VENDOR" && !wholesalerId) {
      setSubmitError(WORKFLOW_PURCHASES_VENDOR_REQUIRED);
      return;
    }
    setSubmitting(true);
    try {
      await createInventoryPurchase({
        purchase_date: purchaseDate.trim(),
        amount: amt,
        notes: notes.trim() || undefined,
        supplier: supplier.trim() || undefined,
        category: category || undefined,
        purchase_type: purchaseType || undefined,
        payment_status: paymentStatus,
        wholesaler_id:
          paymentStatus === "OWE_VENDOR" ? wholesalerId : undefined,
      });
      setPurchaseDate("");
      setAmount("");
      setNotes("");
      setSupplier("");
      setCategory("");
      setPurchaseType("");
      setPaymentStatus("PAID_NOW");
      setWholesalerId("");
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
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
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
      <fieldset className="block min-w-0">
        <legend className={`mb-2 block ${workspaceFormLabel}`}>Payment</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="payment_status"
              value="PAID_NOW"
              checked={paymentStatus === "PAID_NOW"}
              onChange={() => {
                setPaymentStatus("PAID_NOW");
                setWholesalerId("");
              }}
            />
            {WORKFLOW_PURCHASES_PAYMENT_PAID_NOW}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="payment_status"
              value="OWE_VENDOR"
              checked={paymentStatus === "OWE_VENDOR"}
              onChange={() => setPaymentStatus("OWE_VENDOR")}
            />
            {WORKFLOW_PURCHASES_PAYMENT_OWE_VENDOR}
          </label>
        </div>
      </fieldset>
      {paymentStatus === "OWE_VENDOR" ? (
        <label className="block min-w-0">
          <span className={`mb-1.5 block ${workspaceFormLabel}`}>Vendor</span>
          <WorkspaceNativeSelect
            value={wholesalerId}
            onChange={(e) => setWholesalerId(e.target.value)}
            disabled={vendorsLoading}
            required
          >
            <option value="">
              {vendorsLoading ? "Loading vendors…" : "Select vendor"}
            </option>
            {vendors.map((v) => (
              <option key={v.wholesaler_id} value={v.wholesaler_id}>
                {v.name}
              </option>
            ))}
          </WorkspaceNativeSelect>
        </label>
      ) : null}
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
          Supplier (optional)
        </span>
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="e.g. Acme Liquidators"
          className={`w-full min-w-0 ${workspaceTextInput}`}
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
            Category (optional)
          </span>
          <WorkspaceNativeSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Inventory category"
          >
            <option value="">Not specified</option>
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </WorkspaceNativeSelect>
        </label>
        <label className="block min-w-0">
          <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
            Purchase type (optional)
          </span>
          <WorkspaceNativeSelect
            value={purchaseType}
            onChange={(e) => setPurchaseType(e.target.value)}
            aria-label="Inventory purchase type"
          >
            <option value="">Not specified</option>
            {INVENTORY_PURCHASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </WorkspaceNativeSelect>
        </label>
      </div>
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
          {submitting ? "Saving…" : WORKFLOW_PURCHASES_RECORD_INVENTORY_LABEL}
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

export function InventoryActivityPanel({
  reloadToken,
  search = "",
  purchaseTypeFilter = "",
}: {
  reloadToken?: number;
  search?: string;
  purchaseTypeFilter?: string;
}) {
  const [purchases, setPurchases] = useState<InventoryPurchaseDTO[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localReloadToken, setLocalReloadToken] = useState(0);
  const [sortKey, setSortKey] = useState<InventorySortKey>("purchase_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [vendorLookup, setVendorLookup] = useState<Map<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    fetchWholesalerBalances()
      .then((rows) => {
        if (!cancelled) setVendorLookup(buildVendorNameLookup(rows));
      })
      .catch(() => {
        if (!cancelled) setVendorLookup(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  }, [reloadToken, localReloadToken]);

  const filtered = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter((row) => {
      if (purchaseTypeFilter && row.purchase_type !== purchaseTypeFilter) {
        return false;
      }
      return matchesInventorySearch(row, search);
    });
  }, [purchases, search, purchaseTypeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "purchase_date":
          cmp = a.purchase_date.localeCompare(b.purchase_date);
          break;
        case "amount":
          cmp = parseAmount(a.amount) - parseAmount(b.amount);
          break;
        case "category":
          cmp = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "purchase_type":
          cmp = (a.purchase_type ?? "").localeCompare(b.purchase_type ?? "");
          break;
        case "supplier":
          cmp = (a.supplier ?? "").localeCompare(b.supplier ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: InventorySortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "purchase_date" || key === "amount" ? "desc" : "asc");
    }
  };

  const SortIndicator = ({ column }: { column: InventorySortKey }) =>
    sortKey === column ? (
      <span className="text-gray-400" aria-hidden>
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    ) : null;

  const mobileSortValue = `${sortKey}:${sortDir}`;
  const handleMobileSort = (raw: string) => {
    const i = raw.lastIndexOf(":");
    if (i <= 0) return;
    const key = raw.slice(0, i) as InventorySortKey;
    const dir = raw.slice(i + 1);
    if (dir !== "asc" && dir !== "desc") return;
    if (
      key === "purchase_date" ||
      key === "amount" ||
      key === "category" ||
      key === "purchase_type" ||
      key === "supplier"
    ) {
      setSortKey(key);
      setSortDir(dir);
    }
  };

  const hasFilters = search.trim().length > 0 || purchaseTypeFilter.length > 0;

  return (
    <WorkspaceCard>
      <WorkspaceCardHeader
        className="border-gray-100 px-4 py-3 sm:px-5"
        toolbar
        title={WORKFLOW_PURCHASES_INVENTORY_RECENT_TITLE}
        titleClassName="text-lg font-semibold text-gray-900"
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!loading && !error && purchases?.length ? (
              <p className="text-xs font-medium text-gray-500">
                {sorted.length === purchases.length
                  ? `${purchases.length} events`
                  : `${sorted.length} of ${purchases.length} events`}
              </p>
            ) : null}
            <PurchasesViewHistoryLink href={PURCHASES_INVENTORY_HISTORY_HREF} />
          </div>
        }
      />
      {loading ? (
        <div className="px-4 py-6 text-sm text-gray-500 sm:px-5">Loading…</div>
      ) : error ? (
        <WorkspaceInlineError
          title="Could not load recent inventory purchases."
          message={error}
          onRetry={() => setLocalReloadToken((t) => t + 1)}
          className="m-4"
        />
      ) : !purchases?.length ? (
        <div className="px-4 py-6 text-center sm:px-5">
          <p className="text-sm font-medium text-gray-600">
            {WORKFLOW_EMPTY_INVENTORY_TITLE}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {WORKFLOW_EMPTY_INVENTORY_HINT}
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-4 py-6 text-center sm:px-5">
          <p className="text-sm font-medium text-gray-600">
            No inventory purchases match your search
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {hasFilters
              ? "Try a different search term or clear filters."
              : WORKFLOW_EMPTY_INVENTORY_HINT}
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
                aria-label="Sort purchase list"
              >
                <option value="purchase_date:desc">Date (newest first)</option>
                <option value="purchase_date:asc">Date (oldest first)</option>
                <option value="amount:desc">Amount (highest first)</option>
                <option value="amount:asc">Amount (lowest first)</option>
                <option value="supplier:asc">Supplier (A–Z)</option>
                <option value="supplier:desc">Supplier (Z–A)</option>
                <option value="purchase_type:asc">Type (A–Z)</option>
                <option value="category:asc">Category (A–Z)</option>
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
                      {formatDate(row.purchase_date)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-600">
                    {paymentStatusLabel(row.payment_status)}
                  </p>
                  {row.category || row.purchase_type || row.supplier ? (
                    <p className="mt-1.5 text-xs text-gray-500">
                      {[row.category, row.purchase_type]
                        .filter((v) => v && v.trim())
                        .join(" · ")}
                      {row.supplier?.trim() ? (
                        <>
                          {row.category || row.purchase_type ? " · " : null}
                          <SupplierCell
                            supplier={row.supplier}
                            vendorLookup={vendorLookup}
                          />
                        </>
                      ) : null}
                    </p>
                  ) : null}
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
                      onClick={() => handleSort("purchase_date")}
                      className={`${thBtn} min-w-0`}
                    >
                      Date
                      <SortIndicator column="purchase_date" />
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
                    <span className="font-medium text-stone-700">Payment</span>
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
                    <button
                      type="button"
                      onClick={() => handleSort("purchase_type")}
                      className={`${thBtn} min-w-0`}
                    >
                      Type
                      <SortIndicator column="purchase_type" />
                    </button>
                  </th>
                  <th
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("supplier")}
                      className={`${thBtn} min-w-0`}
                    >
                      Supplier
                      <SortIndicator column="supplier" />
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
                      {formatDate(row.purchase_date)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-right text-sm font-semibold text-stone-900 ${workspaceTableBodyCellPadding} ${workspaceMoneyTabular}`}
                    >
                      {formatCurrency(parseAmount(row.amount))}
                    </td>
                    <td
                      className={`whitespace-nowrap text-sm font-medium text-stone-700 ${workspaceTableBodyCellPadding}`}
                    >
                      {paymentStatusLabel(row.payment_status)}
                    </td>
                    <td
                      className={`whitespace-nowrap text-sm font-medium text-stone-700 ${workspaceTableBodyCellPadding}`}
                    >
                      {row.category?.trim() ? (
                        row.category
                      ) : (
                        <span className="font-normal text-gray-400">—</span>
                      )}
                    </td>
                    <td
                      className={`whitespace-nowrap text-sm font-medium text-stone-700 ${workspaceTableBodyCellPadding}`}
                    >
                      {row.purchase_type?.trim() ? (
                        row.purchase_type
                      ) : (
                        <span className="font-normal text-gray-400">—</span>
                      )}
                    </td>
                    <td
                      className={`text-sm font-medium text-stone-700 ${workspaceTableBodyCellPadding}`}
                    >
                      <SupplierCell
                        supplier={row.supplier}
                        vendorLookup={vendorLookup}
                      />
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
export function InventoryTabPanel() {
  return <InventoryActivityPanel />;
}
