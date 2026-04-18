"use client";

import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatDate,
  formatLedgerRunningBalance,
} from "@/lib/format";
import { formatDaysAgo } from "@/app/(admin)/admin/_lib/timeAgo";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  WorkspaceLedgerDisclosureIcon,
  WorkspaceLedgerLeadingAffordanceCell,
  WorkspaceLedgerLineItemsDetailRow,
  WorkspaceLedgerLineItemsPanel,
  WorkspaceLedgerPaymentEditAffordanceCell,
  WorkspaceLedgerTrailingSpacerCell,
  WorkspaceLedgerVendorExpenseEditAffordanceCell,
  WorkspaceTableStaticRow,
  workspaceLedgerTableColumnCount,
  type WorkspaceLedgerLineItem,
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceCard,
  workspaceLedgerRowPayment,
  workspaceLedgerRowPaymentSelected,
  workspaceLedgerRowSettlement,
  workspaceLedgerRowSettlementExpandable,
  workspaceLedgerRowVendorExpense,
  workspaceLedgerRowVendorExpenseSelected,
  workspaceLedgerRunningBalanceAmount,
  workspaceLedgerShowNameLink,
  workspaceLedgerShowNamePlain,
  workspacePageContentWidthWide,
  workspacePanel,
  workspaceStatEyebrow,
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyPositive,
  workspaceMoneyTabular,
  workspaceSectionTitle,
  workspaceSectionToolbar,
  workspaceShowsTableStatusDotClosed,
  workspaceShowsTableStatusDotOpen,
  workspaceTableCellMeta,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  workspaceFinancialVendorLedgerColumn,
  workspaceFinancialVendorMainGrid,
  workspaceFinancialVendorPrimaryColumn,
} from "@/app/(admin)/admin/_lib/workspacePageRegions";
import { WholesalerLedgerExportMenu } from "./WholesalerLedgerExportMenu";
import {
  WholesalerVendorMoneySection,
  type VendorMoneyTab,
} from "./WholesalerVendorMoneySection";
import type { VendorExpenseEditDraft } from "./WholesalerInlineExpenseSection";
import {
  fetchWholesalerBalances,
  fetchWholesalerStatement,
  mapBalanceRowToListView,
  mapStatementRowToDetailView,
  type WholesalerListRowView,
  type WholesalerStatementRowView,
} from "@/src/lib/api/wholesalers";
import { fetchPayments, type PaymentDTO } from "@/src/lib/api/payments";

function LedgerEntryTypeLabel({ row }: { row: WholesalerStatementRowView }) {
  if (row.type === "PAYMENT") {
    return (
      <span className="inline-flex items-center gap-[5px] sm:gap-1.5">
        <span
          className={`${workspaceShowsTableStatusDotClosed} translate-y-px`}
          aria-hidden
        />
        <span className="text-[11px] font-medium leading-none text-gray-800">
          Payment
        </span>
      </span>
    );
  }
  if (row.ledgerEntryKind === "VENDOR_EXPENSE") {
    return (
      <span className="inline-flex items-center gap-[5px] sm:gap-1.5">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 translate-y-px"
          aria-hidden
        />
        <span className="text-[11px] font-medium leading-none text-gray-800">
          Expense
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[5px] sm:gap-1.5">
      <span
        className={`${workspaceShowsTableStatusDotOpen} translate-y-px`}
        aria-hidden
      />
      <span className="text-[11px] font-medium leading-none text-gray-800">
        Settlement
      </span>
    </span>
  );
}

function mapStatementLinesToLedgerLineItems(
  lines: NonNullable<WholesalerStatementRowView["lines"]>,
): WorkspaceLedgerLineItem[] {
  return lines.map((l) => ({
    itemName: l.itemName,
    quantity: l.quantity,
    unitPrice: l.unitPriceCents / 100,
    lineTotal: l.lineTotalCents / 100,
  }));
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
    <nav aria-label="Breadcrumb" className="text-sm font-medium leading-snug">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-stone-600">
        <li>
          <Link
            href="/admin/balances"
            className="rounded-sm text-stone-800 underline decoration-stone-400/80 underline-offset-[3px] transition-colors hover:text-stone-950 hover:decoration-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
          >
            Balances
          </Link>
        </li>
        <li className="select-none text-stone-300" aria-hidden>
          /
        </li>
        <li className="min-w-0 max-w-full text-stone-900" aria-current="page">
          <span className="block truncate font-semibold tracking-tight">
            {currentLabel}
          </span>
        </li>
      </ol>
    </nav>
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
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [ledgerFocus, setLedgerFocus] = useState<
    | { kind: "PAYMENT"; id: string }
    | { kind: "VENDOR_EXPENSE"; id: string }
    | null
  >(null);
  const [moneyTab, setMoneyTab] = useState<VendorMoneyTab>("payment");

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
    if (reloadToken === 0) {
      setLoading(true);
    }
    setError(null);

    Promise.all([
      fetchWholesalerBalances(),
      fetchWholesalerStatement(id),
      fetchPayments({ wholesalerId: id }),
    ])
      .then(([balances, statementRows, paymentRows]) => {
        if (cancelled) return;
        const found = balances
          .map(mapBalanceRowToListView)
          .find((row) => row.id === id);
        setWholesaler(found ?? null);
        setStatement(statementRows.map(mapStatementRowToDetailView));
        setPayments(paymentRows);
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

  useEffect(() => {
    if (!ledgerFocus) return;
    if (ledgerFocus.kind === "PAYMENT") {
      const exists = payments.some((p) => p.id === ledgerFocus.id);
      if (!exists) setLedgerFocus(null);
      return;
    }
    const exists = statement.some(
      (r) =>
        r.entryId === ledgerFocus.id && r.ledgerEntryKind === "VENDOR_EXPENSE",
    );
    if (!exists) setLedgerFocus(null);
  }, [ledgerFocus, payments, statement]);

  useEffect(() => {
    if (!ledgerFocus) return;
    const anchorId =
      ledgerFocus.kind === "PAYMENT"
        ? "vendor-inline-payment"
        : "vendor-inline-expense";
    document.getElementById(anchorId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [ledgerFocus]);

  const balance = useMemo(() => {
    if (statement.length === 0) return wholesaler?.balanceOwed ?? 0;
    return statement[statement.length - 1]?.runningBalance ?? 0;
  }, [statement, wholesaler]);

  const editPaymentForForm =
    ledgerFocus?.kind === "PAYMENT"
      ? (payments.find((p) => p.id === ledgerFocus.id) ?? null)
      : null;

  const editExpenseForForm: VendorExpenseEditDraft | null =
    ledgerFocus?.kind === "VENDOR_EXPENSE"
      ? (() => {
          const row = statement.find((r) => r.entryId === ledgerFocus.id);
          if (!row || row.ledgerEntryKind !== "VENDOR_EXPENSE") return null;
          return {
            id: row.entryId,
            amount: row.amountOwed ?? 0,
            description: row.description?.trim() || row.showName || "",
            expense_date: row.date,
          };
        })()
      : null;

  function handleMoneyTabChange(tab: VendorMoneyTab) {
    setMoneyTab(tab);
    if (tab === "payment" && ledgerFocus?.kind === "VENDOR_EXPENSE") {
      setLedgerFocus(null);
    }
    if (tab === "expense" && ledgerFocus?.kind === "PAYMENT") {
      setLedgerFocus(null);
    }
  }

  function handleLedgerRowActivate(row: WholesalerStatementRowView) {
    if (row.type === "PAYMENT") {
      setMoneyTab("payment");
      setLedgerFocus((prev) =>
        prev?.kind === "PAYMENT" && prev.id === row.entryId
          ? null
          : { kind: "PAYMENT", id: row.entryId },
      );
      return;
    }
    if (row.ledgerEntryKind === "VENDOR_EXPENSE") {
      setMoneyTab("expense");
      setLedgerFocus((prev) =>
        prev?.kind === "VENDOR_EXPENSE" && prev.id === row.entryId
          ? null
          : { kind: "VENDOR_EXPENSE", id: row.entryId },
      );
    }
  }

  const lastPaymentSubtext = wholesaler ? (
    <>Last payment: {formatDaysAgo(wholesaler.last_payment_date)}</>
  ) : null;

  if (loading && reloadToken === 0) {
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
        />
      </AdminPageIntroSection>

      <AdminPageContainer contentWidthClassName={workspacePageContentWidthWide}>
        <div className={workspaceFinancialVendorMainGrid}>
          <div className={workspaceFinancialVendorPrimaryColumn}>
            <section className="min-w-0" aria-label="Wholesaler summary">
              <div className={`overflow-hidden ${workspaceCard}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-stretch sm:divide-x sm:divide-gray-200/80">
                  <div className="min-w-0 border-b border-gray-200/80 px-4 py-4 sm:border-b-0 sm:px-5 sm:py-4">
                    <div className="flex h-full flex-col justify-center border-l-[3px] border-rose-400/50 pl-3 sm:pl-3.5">
                      <p
                        className={`${workspaceStatEyebrow} min-w-0 break-words [hyphens:auto]`}
                      >
                        Current balance
                      </p>
                      <p
                        className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.65rem] ${workspaceMoneyClassForLiability(balance)}`}
                      >
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center border-b border-gray-200/80 px-4 py-4 sm:border-b-0 sm:px-5 sm:py-4">
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
                  <div className="flex min-w-0 flex-col justify-center px-4 py-4 sm:px-5 sm:py-4">
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

            <WholesalerVendorMoneySection
              wholesalerId={id}
              currentBalance={balance}
              activeTab={moneyTab}
              onTabChange={handleMoneyTabChange}
              paymentEdit={editPaymentForForm}
              expenseEdit={editExpenseForForm}
              onCancelPaymentEdit={() =>
                setLedgerFocus((f) => (f?.kind === "PAYMENT" ? null : f))
              }
              onCancelExpenseEdit={() =>
                setLedgerFocus((f) => (f?.kind === "VENDOR_EXPENSE" ? null : f))
              }
              onRecorded={() => {
                setReloadToken((v) => v + 1);
                setLedgerFocus(null);
              }}
            />
          </div>

          <div className={workspaceFinancialVendorLedgerColumn}>
            <section
              className={`min-w-0 overflow-hidden ${workspacePanel}`}
              aria-labelledby="wholesaler-ledger-heading"
            >
              <div
                className={`${workspaceSectionToolbar} items-start gap-3 sm:items-center`}
              >
                <div className="min-w-0 flex-1">
                  <h2
                    id="wholesaler-ledger-heading"
                    className={workspaceSectionTitle}
                  >
                    Ledger
                  </h2>
                </div>
                <div className="shrink-0 self-center pt-0.5 sm:pt-0">
                  <WholesalerLedgerExportMenu
                    wholesalerId={id}
                    onStatementError={setStatementExportError}
                    onLedgerError={setLedgerExportError}
                  />
                </div>
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
                <table className="min-w-full table-fixed divide-y divide-gray-100">
                  <colgroup>
                    <col className="w-9 sm:w-10" />
                    <col />
                    <col className="min-w-0" />
                    <col className="w-[7.25rem] sm:w-[8rem]" />
                    <col className="w-[6.5rem] sm:w-28" />
                    <col className="w-[6.5rem] sm:w-28" />
                    <col className="w-[7rem] sm:w-32" />
                    <col className="w-9 sm:w-10" />
                  </colgroup>
                  <thead className={workspaceTheadSticky}>
                    <tr>
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-center`}
                      >
                        <span className="sr-only">Line items</span>
                      </th>
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
                        Details
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
                      <th
                        scope="col"
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {statement.length === 0 ? (
                      <tr>
                        <td
                          colSpan={workspaceLedgerTableColumnCount}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          No ledger entries yet.
                        </td>
                      </tr>
                    ) : (
                      statement.flatMap((row) => {
                        const isItemized =
                          row.type === "OWED" &&
                          row.ledgerEntryKind === "SHOW_OBLIGATION" &&
                          row.calculationMethod === "ITEMIZED" &&
                          (row.lines?.length ?? 0) > 0;
                        const isExpanded = expandedEntryIds.has(row.entryId);

                        const isPaymentRow = row.type === "PAYMENT";
                        const isVendorExpenseRow =
                          row.ledgerEntryKind === "VENDOR_EXPENSE";
                        const isRowPaymentSelected =
                          isPaymentRow &&
                          ledgerFocus?.kind === "PAYMENT" &&
                          ledgerFocus.id === row.entryId;
                        const isRowExpenseSelected =
                          isVendorExpenseRow &&
                          ledgerFocus?.kind === "VENDOR_EXPENSE" &&
                          ledgerFocus.id === row.entryId;

                        const showCell =
                          row.showId != null &&
                          row.showId !== "" &&
                          row.ledgerEntryKind === "SHOW_OBLIGATION" ? (
                            <Link
                              href={`/admin/shows/${row.showId}`}
                              className={workspaceLedgerShowNameLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.showName}
                            </Link>
                          ) : (
                            <span
                              className={`${workspaceLedgerShowNamePlain} line-clamp-3 break-words`}
                            >
                              {row.showName}
                            </span>
                          );

                        const ledgerRowKind = isPaymentRow
                          ? "payment"
                          : isVendorExpenseRow
                            ? "vendorExpense"
                            : isItemized
                              ? "settlementExpandable"
                              : "settlementStatic";

                        const lineItems: WorkspaceLedgerLineItem[] | null =
                          isItemized && row.lines
                            ? mapStatementLinesToLedgerLineItems(row.lines)
                            : null;

                        const rowSelectedClass = isRowPaymentSelected
                          ? workspaceLedgerRowPaymentSelected
                          : isRowExpenseSelected
                            ? workspaceLedgerRowVendorExpenseSelected
                            : "";

                        const mainRow = (
                          <WorkspaceTableStaticRow
                            key={row.entryId}
                            ledgerRowKind={ledgerRowKind}
                            className={rowSelectedClass}
                            ariaLabel={
                              isPaymentRow
                                ? "Payment — select to edit in Make payment"
                                : isVendorExpenseRow
                                  ? "Expense — select to edit in Add expense"
                                  : isItemized
                                    ? "Settlement with line items — expand or collapse"
                                    : undefined
                            }
                            ariaExpanded={isItemized ? isExpanded : undefined}
                            onClick={
                              isPaymentRow || isVendorExpenseRow
                                ? () => handleLedgerRowActivate(row)
                                : isItemized
                                  ? () => toggleExpanded(row.entryId)
                                  : undefined
                            }
                          >
                            <WorkspaceLedgerLeadingAffordanceCell>
                              {isItemized ? (
                                <WorkspaceLedgerDisclosureIcon
                                  expanded={isExpanded}
                                />
                              ) : null}
                            </WorkspaceLedgerLeadingAffordanceCell>
                            <td
                              className={`whitespace-nowrap align-middle ${workspaceTableBodyCellPadding}`}
                            >
                              <LedgerEntryTypeLabel row={row} />
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
                              className={`whitespace-nowrap text-right align-top ${workspaceLedgerRunningBalanceAmount} ${workspaceTableBodyCellPadding} ${runningBalanceClass(row.runningBalance)}`}
                            >
                              <span
                                aria-label={`Running balance ${formatCurrency(row.runningBalance)}`}
                              >
                                {formatLedgerRunningBalance(row.runningBalance)}
                              </span>
                            </td>
                            {isPaymentRow ? (
                              <WorkspaceLedgerPaymentEditAffordanceCell />
                            ) : isVendorExpenseRow ? (
                              <WorkspaceLedgerVendorExpenseEditAffordanceCell />
                            ) : (
                              <WorkspaceLedgerTrailingSpacerCell />
                            )}
                          </WorkspaceTableStaticRow>
                        );

                        if (!isItemized || !isExpanded || !lineItems?.length) {
                          return [mainRow];
                        }

                        const detailRow = (
                          <WorkspaceLedgerLineItemsDetailRow
                            key={`${row.entryId}-lines`}
                            lines={lineItems}
                          />
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
                      row.ledgerEntryKind === "SHOW_OBLIGATION" &&
                      row.calculationMethod === "ITEMIZED" &&
                      (row.lines?.length ?? 0) > 0;
                    const isExpanded = expandedEntryIds.has(row.entryId);

                    const isPaymentRowMobile = row.type === "PAYMENT";
                    const isVendorExpenseMobile =
                      row.ledgerEntryKind === "VENDOR_EXPENSE";
                    const isCardPaymentSelected =
                      isPaymentRowMobile &&
                      ledgerFocus?.kind === "PAYMENT" &&
                      ledgerFocus.id === row.entryId;
                    const isCardExpenseSelected =
                      isVendorExpenseMobile &&
                      ledgerFocus?.kind === "VENDOR_EXPENSE" &&
                      ledgerFocus.id === row.entryId;

                    const showBlock =
                      row.showId != null &&
                      row.showId !== "" &&
                      row.ledgerEntryKind === "SHOW_OBLIGATION" ? (
                        <Link
                          href={`/admin/shows/${row.showId}`}
                          className={workspaceLedgerShowNameLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.showName}
                        </Link>
                      ) : (
                        <span
                          className={`${workspaceLedgerShowNamePlain} line-clamp-4 break-words`}
                        >
                          {row.showName}
                        </span>
                      );

                    const lineItemsMobile: WorkspaceLedgerLineItem[] | null =
                      isItemized && row.lines
                        ? mapStatementLinesToLedgerLineItems(row.lines)
                        : null;

                    const rowSurface = isPaymentRowMobile
                      ? workspaceLedgerRowPayment
                      : isVendorExpenseMobile
                        ? workspaceLedgerRowVendorExpense
                        : isItemized
                          ? workspaceLedgerRowSettlementExpandable
                          : workspaceLedgerRowSettlement;

                    const cardSelectedClass = isCardPaymentSelected
                      ? workspaceLedgerRowPaymentSelected
                      : isCardExpenseSelected
                        ? workspaceLedgerRowVendorExpenseSelected
                        : "";

                    const card = (
                      <div key={row.entryId}>
                        <div
                          className={`${rowSurface} ${cardSelectedClass} px-4 py-4 sm:px-5`}
                          onClick={
                            isPaymentRowMobile || isVendorExpenseMobile
                              ? () => handleLedgerRowActivate(row)
                              : isItemized
                                ? () => toggleExpanded(row.entryId)
                                : undefined
                          }
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex w-9 shrink-0 justify-center pt-0.5 sm:w-10">
                              {isItemized ? (
                                <WorkspaceLedgerDisclosureIcon
                                  expanded={isExpanded}
                                />
                              ) : (
                                <span
                                  className="inline-block w-3.5 sm:w-4"
                                  aria-hidden
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <LedgerEntryTypeLabel row={row} />
                              <div className="mt-2">{showBlock}</div>
                              <p
                                className={`mt-1.5 text-xs ${workspaceTableCellMeta}`}
                              >
                                {formatDate(row.date)}
                              </p>
                            </div>
                            {isPaymentRowMobile ? (
                              <div
                                className="shrink-0 pt-0.5 text-gray-400 opacity-40 group-hover/ledger-payment:opacity-100"
                                aria-hidden
                              >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                              </div>
                            ) : isVendorExpenseMobile ? (
                              <div
                                className="shrink-0 pt-0.5 text-gray-400 opacity-40 group-hover/ledger-vendor-expense:opacity-100"
                                aria-hidden
                              >
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <div
                                className="w-9 shrink-0 sm:w-10"
                                aria-hidden
                              />
                            )}
                          </div>
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
                                className={`text-right ${workspaceLedgerRunningBalanceAmount} ${runningBalanceClass(row.runningBalance)}`}
                              >
                                <span
                                  aria-label={`Running balance ${formatCurrency(row.runningBalance)}`}
                                >
                                  {formatLedgerRunningBalance(
                                    row.runningBalance,
                                  )}
                                </span>
                              </dd>
                            </div>
                          </dl>
                        </div>
                        {isItemized && isExpanded && lineItemsMobile?.length ? (
                          <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                            <WorkspaceLedgerLineItemsPanel
                              lines={lineItemsMobile}
                            />
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
