"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { AdminSummaryStatGrid } from "@/app/(admin)/admin/_components/AdminSummaryStatGrid";
import { WorkspaceRowChevron } from "@/app/(admin)/admin/_components/WorkspaceRowChevron";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import {
  workspaceCard,
  workspaceInsetFlatList,
  workspaceLedgerRowBaseline,
  workspaceMoneyTabular,
  workspacePanel,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getOwnerActivityPage,
  type OwnerActivityTransactionDTO,
  type OwnerActivityPageDTO,
} from "@/src/lib/api/ownerSelfPay";

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

function OwnerActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200/90 bg-white/90 p-4 shadow-workspace-surface"
          >
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="mt-3 h-7 w-28 rounded bg-stone-100" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-workspace-surface">
        <div className="divide-y divide-stone-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-4">
              <div className="h-4 w-40 rounded bg-stone-100" />
              <div className="mt-2 h-4 w-24 rounded bg-stone-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function rowTone(voided: boolean): string {
  if (voided) {
    return "bg-stone-50/90 text-stone-600";
  }
  return "bg-white text-stone-900";
}

export default function OwnerActivityPage() {
  const [data, setData] = useState<OwnerActivityPageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getOwnerActivityPage(200);
      setData(page);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryItems = useMemo(() => {
    if (!data) return [];
    const { summary } = data;
    return [
      {
        id: "total-paid",
        label: "Total paid",
        value: (
          <p
            className={`text-xl font-semibold text-stone-900 sm:text-2xl ${workspaceMoneyTabular}`}
          >
            {formatCurrency(toNum(summary.totalPaidAmount))}
          </p>
        ),
      },
      {
        id: "last-payout",
        label: "Last payout",
        value: (
          <p className="text-xl font-semibold text-stone-900 sm:text-2xl">
            {summary.lastPaidAt ? formatDate(summary.lastPaidAt) : "—"}
          </p>
        ),
      },
      {
        id: "counts",
        label: "Payouts",
        value: (
          <p className="text-xl font-semibold tabular-nums text-stone-900 sm:text-2xl">
            <span className="text-emerald-800">
              {summary.activePayoutCount}
            </span>
            <span className="mx-1 font-normal text-stone-400">/</span>
            <span className="text-stone-500">{summary.voidedPayoutCount}</span>
            <span className="ml-1 block text-xs font-normal text-stone-500 sm:inline sm:ml-2">
              active / voided
            </span>
          </p>
        ),
      },
    ];
  }, [data]);

  const introSubtitle =
    "Felicia’s weekly self-pay ledger — every payout and void in one place.";

  if (loading) {
    return (
      <>
        <AdminPageIntroSection>
          <AdminPageIntro title="Owner activity" subtitle={introSubtitle} />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <OwnerActivitySkeleton />
        </AdminPageContainer>
      </>
    );
  }

  if (error != null || data == null) {
    return (
      <>
        <AdminPageIntroSection>
          <AdminPageIntro title="Owner activity" subtitle={introSubtitle} />
        </AdminPageIntroSection>
        <AdminPageContainer>
          <WorkspaceInlineError
            title="Could not load owner activity"
            message="Check your connection and retry."
            onRetry={() => void load()}
          >
            <p className="mt-1 text-xs text-amber-900">{error}</p>
          </WorkspaceInlineError>
        </AdminPageContainer>
      </>
    );
  }

  const { transactions } = data;
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <AdminPageIntroSection>
        <AdminPageIntro title="Owner activity" subtitle={introSubtitle} />
      </AdminPageIntroSection>
      <AdminPageContainer>
        <div className="space-y-6 md:space-y-7">
          {summaryItems.length > 0 ? (
            <AdminSummaryStatGrid
              aria-label="Owner payout summary"
              items={summaryItems}
            />
          ) : null}

          <section className={`${workspaceCard} overflow-hidden`}>
            <div className="border-b border-stone-200/80 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-stone-900">Activity</h2>
              <p className="mt-0.5 text-xs text-stone-600">
                Weekly self-pay from the owner account.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Voided payouts were previously recorded, then marked unpaid.
                They remain for audit history.
              </p>
            </div>

            {transactions.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-stone-500 sm:px-5">
                No owner payouts recorded yet.
              </p>
            ) : (
              <ul
                className={`${workspaceInsetFlatList} divide-y divide-stone-100`}
              >
                {transactions.map((tx) => {
                  const voided = Boolean(tx.voidedAt);
                  const expanded = Boolean(expandedRows[tx.id]);
                  const closedShows = tx.sourceContext.shows.filter(
                    (s) => s.includedInPayout,
                  );
                  const openShows = tx.sourceContext.shows.filter(
                    (s) => !s.includedInPayout,
                  );
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
                              {formatCurrency(toNum(tx.amount))}
                            </p>
                            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
                              <div className="flex gap-x-1">
                                <dt className={workspaceTableCellMeta}>Paid</dt>
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
                            {voided ? (
                              <span className="shrink-0 rounded-full bg-stone-200/90 px-2 py-0.5 text-xs font-medium text-stone-700">
                                Voided
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/80">
                                Paid
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center ${
                                expanded ? "rotate-90" : ""
                              } transition-transform`}
                            >
                              <WorkspaceRowChevron className="text-stone-400 transition-colors group-hover/workspace-row:text-stone-600" />
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-stone-600">
                          {refOrNote(tx)}
                        </p>
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
                                <p className="mt-2 text-xs text-stone-500">
                                  None
                                </p>
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
                                        {formatCurrency(
                                          toNum(show.profitAmount),
                                        )}
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
                                <p className="mt-2 text-xs text-stone-500">
                                  None
                                </p>
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
                                        {formatCurrency(
                                          toNum(show.profitAmount),
                                        )}
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
          </section>

          <div
            className={`${workspacePanel} px-4 py-3 text-xs text-stone-600 sm:px-5`}
          >
            Wholesaler balances and vendor obligations stay on{" "}
            <span className="font-medium text-stone-800">Balances</span> and{" "}
            <span className="font-medium text-stone-800">Accounts</span> — this
            page is only owner self-pay history.
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}
