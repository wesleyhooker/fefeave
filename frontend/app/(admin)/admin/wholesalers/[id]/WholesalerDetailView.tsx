"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatDaysAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import { downloadCsv } from "@/lib/csv";
import { apiGetText } from "@/lib/api";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WorkspaceTableStaticRow,
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceActionPrimaryMd,
  workspaceActionSecondarySm,
  workspaceCard,
  workspaceStatEyebrow,
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
  workspaceRowTitleLink,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceShowsTableStatusDotClosed,
  workspaceShowsTableStatusDotOpen,
  workspaceTableCellMeta,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { workspacePageTopStack } from "@/app/(admin)/admin/_lib/workspacePageRegions";
import {
  fetchWholesalerBalances,
  fetchWholesalerStatement,
  mapBalanceRowToListView,
  mapStatementRowToDetailView,
  type WholesalerListRowView,
  type WholesalerStatementRowView,
} from "@/src/lib/api/wholesalers";

function LedgerEntryType({ type }: { type: "OWED" | "PAYMENT" }) {
  const isSettlement = type === "OWED";
  const dot = isSettlement
    ? workspaceShowsTableStatusDotOpen
    : workspaceShowsTableStatusDotClosed;
  const label = isSettlement ? "Settlement" : "Payment";
  return (
    <span className="inline-flex items-center gap-[5px] sm:gap-1.5">
      <span className={`${dot} translate-y-px`} aria-hidden />
      <span className="text-[11px] font-medium leading-none text-gray-800">
        {label}
      </span>
    </span>
  );
}

function moneyOwedClass(value: number | null): string {
  if (value === null) return workspaceMoneyTabular;
  if (value <= 0) return `${workspaceMoneyTabular} text-gray-500`;
  return `${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(value)}`;
}

function moneyPaidClass(value: number | null): string {
  if (value === null) return workspaceMoneyTabular;
  if (value <= 0) return `${workspaceMoneyTabular} text-gray-500`;
  return `${workspaceMoneyTabular} font-medium ${workspaceMoneyPositive}`;
}

function runningBalanceClass(value: number): string {
  return workspaceListPrimaryMoneyAmountClass(value);
}

function WholesalerBalancesBreadcrumb({
  currentLabel,
}: {
  currentLabel: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs font-medium">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-stone-500">
        <li>
          <Link
            href="/admin/balances"
            className="transition-colors hover:text-stone-900"
          >
            Balances
          </Link>
        </li>
        <li className="select-none text-stone-300" aria-hidden>
          /
        </li>
        <li className="min-w-0 max-w-full text-stone-800" aria-current="page">
          <span className="block truncate">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );
}

function WholesalerLedgerDownloadMenu({
  wholesalerId,
  onStatementError,
  onLedgerError,
}: {
  wholesalerId: string;
  onStatementError: (message: string | null) => void;
  onLedgerError: (message: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadStatement = async () => {
    onStatementError(null);
    try {
      const csvText = await apiGetText("exports/wholesaler-statement.csv", {
        wholesalerId,
      });
      const d = new Date();
      const filename = `wholesaler-statement-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
      downloadCsv(filename, csvText, { includeBom: false });
      setOpen(false);
    } catch {
      onStatementError("Statement export failed. Please retry.");
    }
  };

  const downloadLedger = async () => {
    onLedgerError(null);
    try {
      const y = new Date().getFullYear();
      const csvText = await apiGetText("exports/ledger.csv", {
        wholesalerId,
        start: `${y}-01-01`,
        end: `${y}-12-31`,
      });
      const d = new Date();
      const filename = `ledger-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
      downloadCsv(filename, csvText, { includeBom: false });
      setOpen(false);
    } catch {
      onLedgerError("Ledger export failed. Please retry.");
    }
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${workspaceActionSecondarySm} gap-1`}
        aria-expanded={open}
        aria-haspopup="true"
        id="wholesaler-ledger-download-trigger"
      >
        Download
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[14rem] origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
          aria-labelledby="wholesaler-ledger-download-trigger"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => void downloadStatement()}
          >
            Download Statement CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => void downloadLedger()}
          >
            Download Ledger CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function WholesalerDetailView({ id }: { id: string }) {
  const [wholesaler, setWholesaler] = useState<WholesalerListRowView | null>(
    null,
  );
  const [statement, setStatement] = useState<WholesalerStatementRowView[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [ledgerExportError, setLedgerExportError] = useState<string | null>(
    null,
  );
  const [statementExportError, setStatementExportError] = useState<
    string | null
  >(null);

  const toggleExpanded = (entryId: string) => {
    setExpandedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchWholesalerBalances(), fetchWholesalerStatement(id)])
      .then(([balances, statementRows]) => {
        if (cancelled) return;
        const found = balances
          .map(mapBalanceRowToListView)
          .find((row) => row.id === id);
        setWholesaler(found ?? null);
        setStatement(statementRows.map(mapStatementRowToDetailView));
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
  }, [id, reloadToken]);

  const balance = useMemo(() => {
    if (statement.length === 0) return wholesaler?.balanceOwed ?? 0;
    return statement[statement.length - 1]?.runningBalance ?? 0;
  }, [statement, wholesaler]);

  const lastPaymentSubtext = wholesaler ? (
    <>Last payment: {formatDaysAgo(wholesaler.last_payment_date)}</>
  ) : null;

  const headerActions = wholesaler ? (
    <Link
      href={`/admin/payments/new?wholesalerId=${id}`}
      className={`${workspaceActionPrimaryMd} w-full justify-center sm:w-auto`}
    >
      Record payment
    </Link>
  ) : null;

  if (loading) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail">
          <AdminPageIntro variant="entity-detail" title="Loading…" />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <p className="text-sm text-stone-600">Loading…</p>
        </AdminPageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail">
          <AdminPageIntro
            variant="entity-detail"
            breadcrumb={<WholesalerBalancesBreadcrumb currentLabel="Vendor" />}
            title="Unable to load vendor"
          />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <WorkspaceInlineError
            title="Something went wrong"
            message={error}
            onRetry={() => setReloadToken((v) => v + 1)}
          />
        </AdminPageContainer>
      </>
    );
  }

  if (!wholesaler) {
    return (
      <>
        <AdminPageIntroSection variant="entity-detail">
          <AdminPageIntro
            variant="entity-detail"
            breadcrumb={
              <WholesalerBalancesBreadcrumb currentLabel="Not found" />
            }
            title="Wholesaler not found"
            subtitle="This vendor isn't in your balances list, or the link may be outdated."
          />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <p className="text-sm text-stone-600">
            <Link
              href="/admin/balances"
              className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:text-stone-950"
            >
              Return to Balances
            </Link>{" "}
            to pick a vendor.
          </p>
        </AdminPageContainer>
      </>
    );
  }

  return (
    <>
      <AdminPageIntroSection variant="entity-detail">
        <AdminPageIntro
          variant="entity-detail"
          breadcrumb={
            <WholesalerBalancesBreadcrumb currentLabel={wholesaler.name} />
          }
          title={wholesaler.name}
          subtitle={lastPaymentSubtext}
          action={headerActions}
        />
      </AdminPageIntroSection>

      <AdminPageContainer>
        <div className="mt-8 border-t border-stone-200/70 pt-8 md:mt-12 md:pt-12">
          <div className={workspacePageTopStack}>
            <section className="min-w-0" aria-label="Wholesaler summary">
              <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(120,113,108,0.06)] sm:px-5 sm:py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-baseline sm:gap-6">
                  <div className="min-w-0 sm:pr-2">
                    <p
                      className={`${workspaceStatEyebrow} min-w-0 break-words [hyphens:auto]`}
                    >
                      Current balance
                    </p>
                    <p
                      className={`mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl ${workspaceMoneyClassForLiability(balance)}`}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="min-w-0 border-t border-stone-200/70 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 md:pl-6">
                    <p
                      className={`${workspaceStatEyebrow} min-w-0 break-words [hyphens:auto]`}
                    >
                      Total owed
                    </p>
                    <p
                      className={`mt-1.5 text-base font-semibold tabular-nums text-stone-800 sm:text-lg ${workspaceMoneyTabular}`}
                    >
                      {formatCurrency(wholesaler.totalOwed)}
                    </p>
                  </div>
                  <div className="min-w-0 border-t border-stone-200/70 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 md:pl-6">
                    <p
                      className={`${workspaceStatEyebrow} min-w-0 break-words [hyphens:auto]`}
                    >
                      Total paid
                    </p>
                    <p
                      className={`mt-1.5 text-base font-semibold tabular-nums text-stone-800 sm:text-lg ${workspaceMoneyTabular}`}
                    >
                      {formatCurrency(wholesaler.totalPaid)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`min-w-0 overflow-hidden ${workspaceCard}`}
              aria-labelledby="wholesaler-ledger-heading"
            >
              <div className={workspaceSectionToolbar}>
                <h2
                  id="wholesaler-ledger-heading"
                  className={workspaceSectionTitle}
                >
                  Ledger
                </h2>
                <WholesalerLedgerDownloadMenu
                  wholesalerId={id}
                  onStatementError={setStatementExportError}
                  onLedgerError={setLedgerExportError}
                />
              </div>

              {statementExportError != null || ledgerExportError != null ? (
                <div
                  className="border-b border-amber-100 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900"
                  role="alert"
                >
                  {statementExportError ?? ledgerExportError}
                </div>
              ) : null}

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className={workspaceTheadSticky}>
                    <tr>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Show
                      </th>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        Amount owed
                      </th>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        Amount paid
                      </th>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        Running balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {statement.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          No ledger entries yet.
                        </td>
                      </tr>
                    ) : (
                      statement.flatMap((row) => {
                        const isItemized =
                          row.type === "OWED" &&
                          row.calculationMethod === "ITEMIZED" &&
                          (row.lines?.length ?? 0) > 0;
                        const isExpanded = expandedEntryIds.has(row.entryId);

                        const showCell =
                          row.showId != null && row.showId !== "" ? (
                            <Link
                              href={`/admin/shows/${row.showId}`}
                              className={`text-sm ${workspaceRowTitleLink}`}
                            >
                              {row.showName}
                            </Link>
                          ) : (
                            <span
                              className={`text-sm ${workspaceTableCellMeta}`}
                            >
                              {row.showName}
                            </span>
                          );

                        const mainRow = (
                          <WorkspaceTableStaticRow key={row.entryId}>
                            <td
                              className={`whitespace-nowrap align-middle ${workspaceTableBodyCellPadding}`}
                            >
                              <span className="inline-flex flex-wrap items-center gap-2">
                                <LedgerEntryType type={row.type} />
                                {isItemized && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(row.entryId);
                                    }}
                                    className="text-xs font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900"
                                  >
                                    {isExpanded ? "Hide lines" : "Show lines"}
                                  </button>
                                )}
                              </span>
                            </td>
                            <td
                              className={`min-w-0 max-w-[12rem] sm:max-w-md ${workspaceTableBodyCellPadding}`}
                            >
                              {showCell}
                            </td>
                            <td
                              className={`whitespace-nowrap align-top text-xs ${workspaceTableBodyCellPadding} ${workspaceTableCellMeta}`}
                            >
                              {formatDate(row.date)}
                            </td>
                            <td
                              className={`whitespace-nowrap text-right align-top text-sm ${workspaceTableBodyCellPadding} ${moneyOwedClass(row.amountOwed)}`}
                            >
                              {row.amountOwed !== null
                                ? formatCurrency(row.amountOwed)
                                : "—"}
                            </td>
                            <td
                              className={`whitespace-nowrap text-right align-top text-sm ${workspaceTableBodyCellPadding} ${moneyPaidClass(row.amountPaid)}`}
                            >
                              {row.amountPaid !== null
                                ? formatCurrency(row.amountPaid)
                                : "—"}
                            </td>
                            <td
                              className={`whitespace-nowrap text-right align-top text-lg font-semibold tabular-nums sm:text-xl ${workspaceTableBodyCellPadding} ${runningBalanceClass(row.runningBalance)}`}
                            >
                              {formatCurrency(row.runningBalance)}
                            </td>
                          </WorkspaceTableStaticRow>
                        );

                        if (!isItemized || !isExpanded) {
                          return [mainRow];
                        }

                        const detailRow = (
                          <tr
                            key={`${row.entryId}-lines`}
                            className="bg-gray-50"
                          >
                            <td colSpan={6} className="px-3 py-3 sm:px-4">
                              <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-workspace-surface-sm">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                      <th className="px-4 py-2">Item</th>
                                      <th className="px-4 py-2 text-right">
                                        Qty
                                      </th>
                                      <th className="px-4 py-2 text-right">
                                        Unit price
                                      </th>
                                      <th className="px-4 py-2 text-right">
                                        Line total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.lines!.map((line, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 last:border-0"
                                      >
                                        <td className="px-4 py-2 text-gray-700">
                                          {line.itemName}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                                          {line.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                                          {formatCurrency(
                                            line.unitPriceCents / 100,
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                                          {formatCurrency(
                                            line.lineTotalCents / 100,
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        );

                        return [mainRow, detailRow];
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
                {statement.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    No ledger entries yet.
                  </p>
                ) : (
                  statement.flatMap((row) => {
                    const isItemized =
                      row.type === "OWED" &&
                      row.calculationMethod === "ITEMIZED" &&
                      (row.lines?.length ?? 0) > 0;
                    const isExpanded = expandedEntryIds.has(row.entryId);

                    const showBlock =
                      row.showId != null && row.showId !== "" ? (
                        <Link
                          href={`/admin/shows/${row.showId}`}
                          className={`text-sm ${workspaceRowTitleLink}`}
                        >
                          {row.showName}
                        </Link>
                      ) : (
                        <span className={`text-sm ${workspaceTableCellMeta}`}>
                          {row.showName}
                        </span>
                      );

                    const card = (
                      <div
                        key={row.entryId}
                        className="bg-white px-4 py-4 sm:px-5"
                      >
                        <LedgerEntryType type={row.type} />
                        <div className="mt-2">{showBlock}</div>
                        <p
                          className={`mt-1.5 text-xs ${workspaceTableCellMeta}`}
                        >
                          {formatDate(row.date)}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                              Owed
                            </dt>
                            <dd
                              className={`text-right ${moneyOwedClass(row.amountOwed)}`}
                            >
                              {row.amountOwed !== null
                                ? formatCurrency(row.amountOwed)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                              Paid
                            </dt>
                            <dd
                              className={`text-right ${moneyPaidClass(row.amountPaid)}`}
                            >
                              {row.amountPaid !== null
                                ? formatCurrency(row.amountPaid)
                                : "—"}
                            </dd>
                          </div>
                          <div className="col-span-2 border-t border-gray-100 pt-2">
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                              Running balance
                            </dt>
                            <dd
                              className={`text-right text-lg font-semibold tabular-nums sm:text-xl ${runningBalanceClass(row.runningBalance)}`}
                            >
                              {formatCurrency(row.runningBalance)}
                            </dd>
                          </div>
                        </dl>
                        {isItemized ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.entryId)}
                            className="mt-3 text-xs font-medium text-stone-600 underline"
                          >
                            {isExpanded ? "Hide lines" : "Show lines"}
                          </button>
                        ) : null}
                        {isItemized && isExpanded ? (
                          <div className="mt-3 rounded-lg border border-gray-200 bg-stone-50/50 p-3">
                            <table className="w-full text-xs">
                              <tbody>
                                {row.lines!.map((line, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-gray-100 last:border-0"
                                  >
                                    <td className="py-1.5 text-gray-700">
                                      {line.itemName}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums text-gray-600">
                                      {formatCurrency(
                                        line.lineTotalCents / 100,
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    );

                    return [card];
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}
