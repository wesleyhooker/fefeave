"use client";

import { BanknotesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaymentsTableSkeleton } from "@/app/(admin)/admin/_components/AdminPageSkeletons";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  WorkspaceTableChevronCell,
  WorkspaceTableNavRow,
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionIconMd,
  workspaceActionPrimaryMd,
  workspaceCard,
  workspaceMoneyNeutral,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchPayments,
  mapPaymentToListRowView,
  type PaymentListRowView,
} from "@/src/lib/api/payments";
import { fetchWholesalerBalances } from "@/src/lib/api/wholesalers";

const METHOD_LABELS: Record<string, string> = {
  Cash: "Cash",
  Zelle: "Zelle",
  Venmo: "Venmo",
  Check: "Check",
  Other: "Other",
};

function wholesalerDetailHref(wholesalerId: string): string {
  return `/admin/wholesalers/${wholesalerId}`;
}

export function PaymentsListView() {
  const [payments, setPayments] = useState<PaymentListRowView[] | null>(null);
  const [wholesalerNameById, setWholesalerNameById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchPayments(), fetchWholesalerBalances()])
      .then(([paymentRows, wholesalerRows]) => {
        if (cancelled) return;
        setPayments(paymentRows.map(mapPaymentToListRowView));
        const map: Record<string, string> = {};
        for (const row of wholesalerRows) {
          map[row.wholesaler_id] = row.name;
        }
        setWholesalerNameById(map);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const rows = useMemo(() => payments ?? [], [payments]);

  const rowNavigateLabel = (name: string) => `Open ${name}`;

  if (loading) {
    return <PaymentsTableSkeleton />;
  }

  return (
    <>
      <AdminPageIntroSection>
        <AdminPageIntro
          title="Payments"
          subtitle="Payment history"
          action={
            <Link
              href="/admin/payments/new"
              className={`${workspaceActionPrimaryMd} w-full justify-center sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<BanknotesIcon className={workspaceActionIconMd} />}
              >
                Record payment
              </WorkspaceActionLabel>
            </Link>
          }
        />
      </AdminPageIntroSection>

      <AdminPageContainer>
        {error != null ? (
          <WorkspaceInlineError
            title="Could not load payments."
            message={error}
            onRetry={() => setReloadToken((v) => v + 1)}
            className="mb-4"
          />
        ) : null}

        <section
          className={`min-w-0 overflow-hidden ${workspaceCard}`}
          aria-labelledby="payments-table-heading"
        >
          <h2 id="payments-table-heading" className="sr-only">
            Payments
          </h2>

          <div className="md:hidden">
            <div className="space-y-3 p-3 sm:p-4">
              {rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-500">
                  No payments recorded yet.
                </p>
              ) : (
                rows.map((p) => {
                  const wholesalerName = wholesalerNameById[p.wholesalerId];
                  const name = wholesalerName ?? "Unknown";
                  const methodLabel = METHOD_LABELS[p.method] ?? p.method;
                  const href = wholesalerDetailHref(p.wholesalerId);
                  return (
                    <Link
                      key={p.id}
                      href={href}
                      className="group/card block rounded-lg border border-gray-200 bg-white p-4 shadow-workspace-surface-sm transition-[border-color,box-shadow] duration-200 ease-out hover:border-gray-300 hover:shadow-md"
                      aria-label={rowNavigateLabel(name)}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={`text-xs ${workspaceTableCellMeta}`}>
                          {formatDate(p.date)}
                        </p>
                        <p
                          className={`text-lg font-semibold ${workspaceMoneyTabular} ${workspaceMoneyNeutral}`}
                        >
                          {formatCurrency(p.amount)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover/card:text-gray-800">
                        {name}
                      </p>
                      <p className={`mt-1 text-xs ${workspaceTableCellMeta}`}>
                        {methodLabel}
                        {p.reference ? (
                          <span className="text-gray-500">
                            {" "}
                            · Ref. {p.reference}
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                        <WorkspaceRowChevron className="text-gray-400 transition-transform duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:text-gray-700" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed divide-y divide-gray-100">
              <colgroup>
                <col className="w-[7.5rem] sm:w-[8.5rem]" />
                <col className="min-w-0" />
                <col className="w-[7.5rem] sm:w-[8.5rem]" />
                <col className="w-[6.5rem] sm:w-[7rem]" />
                <col className="min-w-[6rem]" />
                <col className="w-10 sm:w-12" />
              </colgroup>
              <thead className={workspaceTheadSticky}>
                <tr>
                  <th
                    scope="col"
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    Vendor
                  </th>
                  <th
                    scope="col"
                    className={`${workspaceTableHeaderCellPadding} text-right`}
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    Method
                  </th>
                  <th
                    scope="col"
                    className={`${workspaceTableHeaderCellPadding} text-left`}
                  >
                    Reference
                  </th>
                  <th scope="col" className="relative px-2 py-3 sm:px-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-sm text-gray-500 sm:px-4"
                    >
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => {
                    const wholesalerName = wholesalerNameById[p.wholesalerId];
                    const name = wholesalerName ?? "Unknown";
                    const href = wholesalerDetailHref(p.wholesalerId);
                    return (
                      <WorkspaceTableNavRow
                        key={p.id}
                        href={href}
                        ariaLabel={rowNavigateLabel(name)}
                      >
                        <td
                          className={`whitespace-nowrap text-xs ${workspaceTableBodyCellPadding} ${workspaceTableCellMeta}`}
                        >
                          {formatDate(p.date)}
                        </td>
                        <td
                          className={`min-w-0 max-w-[min(100%,28rem)] ${workspaceTableBodyCellPadding}`}
                        >
                          <span className="text-sm font-semibold text-gray-900 group-hover/workspace-row:text-gray-950">
                            {name}
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap text-right text-base font-semibold ${workspaceTableBodyCellPadding} ${workspaceMoneyTabular} ${workspaceMoneyNeutral}`}
                        >
                          {formatCurrency(p.amount)}
                        </td>
                        <td
                          className={`whitespace-nowrap text-sm ${workspaceTableBodyCellPadding} ${workspaceTableCellMeta}`}
                        >
                          {METHOD_LABELS[p.method] ?? p.method}
                        </td>
                        <td
                          className={`min-w-0 max-w-[12rem] truncate text-sm sm:max-w-none ${workspaceTableBodyCellPadding} ${workspaceTableCellMeta}`}
                        >
                          {p.reference || "—"}
                        </td>
                        <WorkspaceTableChevronCell />
                      </WorkspaceTableNavRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AdminPageContainer>
    </>
  );
}
