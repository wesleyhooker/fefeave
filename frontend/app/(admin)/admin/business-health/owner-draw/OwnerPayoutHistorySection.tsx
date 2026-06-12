"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT,
  WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT_WITH_CURRENT,
  WORKFLOW_EMPTY_OWNER_ACTIVITY_TITLE,
  WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_LABEL,
  WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_NOTE,
  WORKFLOW_OWNER_HISTORY_HEADING,
  WORKFLOW_OWNER_HISTORY_PAID_TO_OWNER,
  WORKFLOW_OWNER_HISTORY_RECORDED,
  WORKFLOW_OWNER_HISTORY_SUBTITLE,
  WORKFLOW_OWNER_HISTORY_VIEW_LEDGER,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import { WorkspaceDetailSettlementStatusBadge } from "@/app/(admin)/admin/_components/WorkspaceListStatus";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import {
  workspaceInsetFlatList,
  workspaceLedgerRowBaseline,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { OwnerActivityTransactionDTO } from "@/src/lib/api/ownerSelfPay";
import {
  OWNER_HISTORY_LEDGER_HREF,
  ownerPayoutLedgerHrefForTransaction,
} from "./ownerLedgerLinks";
import {
  ownerDrawStatusBadgeTone,
  ownerWeekStatusLabel,
  type OwnerWeekStatus,
} from "./ownerWeekStatus";
import { OwnerViewHistoryLink } from "./OwnerViewHistoryLink";

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function weekRangeLabel(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function refOrNote(tx: OwnerActivityTransactionDTO): string {
  const parts = [tx.reference?.trim(), tx.note?.trim()].filter(
    Boolean,
  ) as string[];
  if (parts.length === 0) return "—";
  return [...new Set(parts)].join(" · ");
}

function rowTone(voided: boolean): string {
  if (voided) {
    return "bg-stone-50/90 text-stone-600";
  }
  return "bg-white text-stone-900";
}

function historyStatusBadge(
  voided: boolean,
  weekStatus?: OwnerWeekStatus | null,
): ReturnType<typeof ownerDrawStatusBadgeTone> {
  if (voided) return "Voided";
  if (weekStatus) return ownerDrawStatusBadgeTone(weekStatus);
  return "Paid";
}

export function OwnerPayoutHistorySection({
  transactions,
  currentWeekStartStr,
  currentPeriodTransaction,
  currentPeriodStatus = null,
}: {
  transactions: OwnerActivityTransactionDTO[];
  currentWeekStartStr: string;
  currentPeriodTransaction: OwnerActivityTransactionDTO | null;
  currentPeriodStatus?: OwnerWeekStatus | null;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const pastTransactions = useMemo(
    () => transactions.filter((tx) => tx.weekStartDate !== currentWeekStartStr),
    [transactions, currentWeekStartStr],
  );

  const currentPeriodActive =
    currentPeriodTransaction != null && !currentPeriodTransaction.voidedAt;
  const currentPeriodVoided = Boolean(currentPeriodTransaction?.voidedAt);
  const currentLedgerHref = currentPeriodTransaction
    ? ownerPayoutLedgerHrefForTransaction(currentPeriodTransaction)
    : null;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <WorkspaceCard id="owner-payout-history">
      <WorkspaceCardHeader
        toolbar
        title={WORKFLOW_OWNER_HISTORY_HEADING}
        titleClassName="text-lg font-semibold text-stone-900"
        subtitle={WORKFLOW_OWNER_HISTORY_SUBTITLE}
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {pastTransactions.length > 0 ? (
              <p className="text-xs font-medium text-stone-500">
                {pastTransactions.length} prior weeks
              </p>
            ) : null}
            <OwnerViewHistoryLink href={OWNER_HISTORY_LEDGER_HREF} />
          </div>
        }
      />

      {currentPeriodTransaction ? (
        <div className="border-b border-stone-100 bg-stone-50/40 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_LABEL}
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {weekRangeLabel(
                  currentPeriodTransaction.weekStartDate,
                  currentPeriodTransaction.weekEndDate,
                )}
              </p>
              <p
                className={`mt-1 text-lg font-semibold ${workspaceMoneyTabular}`}
              >
                <Link
                  href={currentLedgerHref ?? OWNER_HISTORY_LEDGER_HREF}
                  className="underline-offset-2 hover:underline"
                >
                  {formatCurrency(toNum(currentPeriodTransaction.amount))}
                </Link>
              </p>
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                <div className="flex gap-x-1">
                  <dt className={workspaceTableCellMeta}>
                    {WORKFLOW_OWNER_HISTORY_RECORDED}
                  </dt>
                  <dd>{formatDate(currentPeriodTransaction.paidAt)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-stone-600">
                {WORKFLOW_OWNER_HISTORY_CURRENT_PERIOD_NOTE}
              </p>
              {currentLedgerHref ? (
                <Link
                  href={currentLedgerHref}
                  className="mt-2 inline-block text-xs font-medium text-stone-700 underline-offset-2 hover:text-stone-900 hover:underline"
                >
                  {WORKFLOW_OWNER_HISTORY_VIEW_LEDGER}
                </Link>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              <WorkspaceDetailSettlementStatusBadge
                status={historyStatusBadge(
                  currentPeriodVoided,
                  currentPeriodStatus,
                )}
              />
              {currentPeriodStatus ? (
                <span className="text-xs font-medium text-stone-500">
                  {ownerWeekStatusLabel(currentPeriodStatus)}
                </span>
              ) : currentPeriodVoided ? (
                <span className="text-xs font-medium text-stone-500">
                  Voided
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {pastTransactions.length === 0 ? (
        <WorkspaceCardBody
          padding={false}
          className="px-4 py-10 text-center sm:px-5"
        >
          <p className="text-sm font-medium text-stone-600">
            {WORKFLOW_EMPTY_OWNER_ACTIVITY_TITLE}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {currentPeriodActive || currentPeriodVoided
              ? WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT_WITH_CURRENT
              : WORKFLOW_EMPTY_OWNER_ACTIVITY_HINT}
          </p>
        </WorkspaceCardBody>
      ) : (
        <ul className={`${workspaceInsetFlatList} divide-y divide-stone-100`}>
          {pastTransactions.map((tx) => {
            const voided = Boolean(tx.voidedAt);
            const expanded = Boolean(expandedRows[tx.id]);
            const closedShows = tx.sourceContext.shows.filter(
              (s) => s.includedInPayout,
            );
            const openShows = tx.sourceContext.shows.filter(
              (s) => !s.includedInPayout,
            );
            const ledgerHref = ownerPayoutLedgerHrefForTransaction(tx);
            return (
              <li
                key={tx.id}
                className={`${workspaceLedgerRowBaseline} ${rowTone(voided)}`}
              >
                <button
                  type="button"
                  onClick={() => toggleRow(tx.id)}
                  className="group/workspace-row w-full px-4 py-4 text-left sm:px-5"
                  aria-expanded={expanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900">
                        {weekRangeLabel(tx.weekStartDate, tx.weekEndDate)}
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${workspaceMoneyTabular}`}
                      >
                        <Link
                          href={ledgerHref}
                          className="underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatCurrency(toNum(tx.amount))}
                        </Link>
                      </p>
                      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                        <div className="flex gap-x-1">
                          <dt className={workspaceTableCellMeta}>
                            {WORKFLOW_OWNER_HISTORY_PAID_TO_OWNER}
                          </dt>
                          <dd>{formatDate(tx.paidAt)}</dd>
                        </div>
                        <div className="flex gap-x-1">
                          <dt className={workspaceTableCellMeta}>
                            Closed shows
                          </dt>
                          <dd className="font-medium tabular-nums">
                            {tx.sourceContext.closedShowsCount}
                          </dd>
                        </div>
                        <div className="flex gap-x-1">
                          <dt className={workspaceTableCellMeta}>
                            Open excluded
                          </dt>
                          <dd className="font-medium tabular-nums">
                            {tx.sourceContext.openShowsExcludedCount}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <WorkspaceDetailSettlementStatusBadge
                        status={voided ? "Voided" : "Paid"}
                      />
                      <span
                        className={`inline-flex items-center ${
                          expanded ? "rotate-90" : ""
                        } transition-transform`}
                      >
                        <WorkspaceRowChevron className="text-stone-400 transition-colors group-hover/workspace-row:text-stone-600" />
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-stone-600">{refOrNote(tx)}</p>
                  <Link
                    href={ledgerHref}
                    className="mt-2 inline-block text-xs font-medium text-stone-700 underline-offset-2 hover:text-stone-900 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {WORKFLOW_OWNER_HISTORY_VIEW_LEDGER}
                  </Link>
                </button>

                {expanded ? (
                  <div className="border-t border-stone-200/70 bg-stone-50/55 px-4 py-3 sm:px-5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <section className="rounded-md border border-emerald-100/80 bg-white/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                            Closed shows (included)
                          </h3>
                          <span
                            className={`text-xs font-semibold ${workspaceMoneyTabular}`}
                          >
                            {formatCurrency(
                              toNum(tx.sourceContext.closedProfitTotal),
                            )}
                          </span>
                        </div>
                        {closedShows.length === 0 ? (
                          <p className="mt-2 text-xs text-stone-500">None</p>
                        ) : (
                          <ul className="mt-2 divide-y divide-stone-100">
                            {closedShows.map((show) => (
                              <li
                                key={show.showId}
                                className="flex items-center justify-between gap-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-stone-900">
                                    {show.name}
                                  </p>
                                  <p className="text-stone-500">
                                    {formatDate(show.showDate)}
                                  </p>
                                </div>
                                <span
                                  className={`${workspaceMoneyTabular} text-stone-900`}
                                >
                                  {formatCurrency(toNum(show.profitAmount))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>

                      <section className="rounded-md border border-stone-200/80 bg-white/80 p-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                          Open shows (excluded)
                        </h3>
                        {openShows.length === 0 ? (
                          <p className="mt-2 text-xs text-stone-500">None</p>
                        ) : (
                          <ul className="mt-2 divide-y divide-stone-100">
                            {openShows.map((show) => (
                              <li
                                key={show.showId}
                                className="flex items-center justify-between gap-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-stone-900">
                                    {show.name}
                                  </p>
                                  <p className="text-stone-500">
                                    {formatDate(show.showDate)} ·{" "}
                                    {show.status.toLowerCase()}
                                  </p>
                                </div>
                                <span
                                  className={`${workspaceMoneyTabular} text-stone-700`}
                                >
                                  {formatCurrency(toNum(show.profitAmount))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </WorkspaceCard>
  );
}
