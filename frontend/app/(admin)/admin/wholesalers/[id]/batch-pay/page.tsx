"use client";

import { BanknotesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminPageContainer } from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminEntityBreadcrumb } from "@/app/(admin)/admin/_components/AdminEntityBreadcrumb";
import {
  BALANCES_PAGE_BREADCRUMB,
  FINANCIALS_WORKSPACE_BREADCRUMB,
} from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import {
  WORKFLOW_EMPTY_BATCH_PAY_FILTERED_HINT,
  WORKFLOW_EMPTY_BATCH_PAY_FILTERED_TITLE,
  WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_HINT,
  WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchWholesalerBalances,
  fetchClosedShowsInBalance,
  type ClosedShowInBalanceRow,
  type PaySchedule,
} from "@/src/lib/api/wholesalers";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  workspaceTableBodyCellPadding,
  workspaceTableHeaderCellPadding,
} from "@/app/(admin)/admin/_components/WorkspaceTableRow";
import {
  workspaceActionCompleteMd,
  workspaceActionIconMd,
  workspaceActionSecondaryMd,
  workspaceCard,
  workspaceFormLabelSecondary,
  workspaceMoneyNeutral,
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
  workspaceRowTitleLink,
  workspaceTableCellMeta,
  workspaceTableRowInteractive,
  workspaceTheadSticky,
} from "@/app/(admin)/admin/_components/workspaceUi";

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type DateWindow = "all" | 7 | 14 | 30;

function defaultDateWindowForSchedule(
  pay_schedule: PaySchedule | undefined,
): DateWindow {
  switch (pay_schedule) {
    case "WEEKLY":
      return 7;
    case "BIWEEKLY":
      return 14;
    case "MONTHLY":
      return 30;
    default:
      return "all";
  }
}

function cutoffDate(windowDays: DateWindow): string | null {
  if (windowDays === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - windowDays);
  return d.toISOString().slice(0, 10);
}

function filterByDateWindow(
  rows: ClosedShowInBalanceRow[],
  windowDays: DateWindow,
): ClosedShowInBalanceRow[] {
  const cutoff = cutoffDate(windowDays);
  if (!cutoff) return rows;
  return rows.filter((row) => row.show_date >= cutoff);
}

const WINDOW_OPTIONS: { value: DateWindow; label: string }[] = [
  { value: "all", label: "All" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export default function BatchPayPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [name, setName] = useState<string | null>(null);
  const [paySchedule, setPaySchedule] = useState<PaySchedule | undefined>(
    undefined,
  );
  const [closedShows, setClosedShows] = useState<ClosedShowInBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateWindow, setDateWindow] = useState<DateWindow>("all");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchWholesalerBalances(), fetchClosedShowsInBalance(id)])
      .then(([balances, showsInBalance]) => {
        if (cancelled) return;
        const row = balances.find((r) => r.wholesaler_id === id);
        setName(row?.name ?? null);
        setPaySchedule((row?.pay_schedule ?? "AD_HOC") as PaySchedule);
        setClosedShows(showsInBalance);
        setDateWindow(
          defaultDateWindowForSchedule(
            (row?.pay_schedule ?? "AD_HOC") as PaySchedule,
          ),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const filteredShows = useMemo(
    () => filterByDateWindow(closedShows, dateWindow),
    [closedShows, dateWindow],
  );

  const totalOwed = useMemo(() => {
    return filteredShows.reduce(
      (sum, row) => sum + parseAmount(row.owed_total),
      0,
    );
  }, [filteredShows]);

  const dateWindowNote =
    dateWindow === "all"
      ? "Showing all closed shows."
      : `Showing closed shows in last ${dateWindow} days.`;

  if (!id) {
    return (
      <AdminPageContainer>
        <WorkspaceInlineError
          title="Invalid wholesaler."
          message="Open this page from Balances and try again."
        />
      </AdminPageContainer>
    );
  }

  if (loading) {
    return (
      <AdminPageContainer>
        <p className="text-sm text-gray-600">Loading balance breakdown...</p>
      </AdminPageContainer>
    );
  }

  if (error) {
    return (
      <AdminPageContainer>
        <WorkspaceInlineError
          title="Could not load balance breakdown."
          message={error}
        />
      </AdminPageContainer>
    );
  }

  return (
    <AdminWorkspacePageLayout
      introVariant="entity-detail"
      intro={
        <AdminPageIntro
          variant="entity-detail"
          title={`Balance breakdown - ${name ?? id}`}
          subtitle="Shows currently contributing to this wholesaler balance."
          breadcrumb={
            <AdminEntityBreadcrumb
              variant="compact"
              segments={[
                FINANCIALS_WORKSPACE_BREADCRUMB,
                BALANCES_PAGE_BREADCRUMB,
                { label: "Balance breakdown", current: true },
              ]}
            />
          }
          action={
            <Link
              href={`/admin/payments/new?wholesalerId=${encodeURIComponent(id)}`}
              className={`${workspaceActionCompleteMd} w-full justify-center sm:w-auto`}
            >
              <WorkspaceActionLabel
                icon={<BanknotesIcon className={workspaceActionIconMd} />}
              >
                Record payment
              </WorkspaceActionLabel>
            </Link>
          }
        />
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        <section className={`p-4 sm:p-5 ${workspaceCard}`}>
          <div className="flex min-w-0 flex-col gap-4">
            <label className="block min-w-0">
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                Date range
              </span>
              <WorkspaceNativeSelect
                value={dateWindow}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateWindow(
                    v === "all" ? "all" : (Number(v) as 7 | 14 | 30),
                  );
                }}
              >
                {WINDOW_OPTIONS.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </WorkspaceNativeSelect>
            </label>
            <p className={`text-sm leading-snug ${workspaceTableCellMeta}`}>
              {dateWindowNote}
            </p>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Total for displayed shows
              </p>
              <p
                className={`mt-1 text-2xl font-semibold tracking-tight ${workspaceMoneyTabular} ${workspaceMoneyNeutral}`}
              >
                {formatCurrency(totalOwed)}
              </p>
            </div>
          </div>
        </section>

        <section className={`min-w-0 overflow-hidden ${workspaceCard}`}>
          <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Closed shows
            </h2>
          </div>
          {filteredShows.length === 0 ? (
            <div className="px-4 py-6 text-center sm:px-5">
              <p className="text-sm font-medium text-gray-600">
                {closedShows.length === 0
                  ? WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_TITLE
                  : WORKFLOW_EMPTY_BATCH_PAY_FILTERED_TITLE}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {closedShows.length === 0
                  ? WORKFLOW_EMPTY_BATCH_PAY_NO_SHOWS_HINT
                  : WORKFLOW_EMPTY_BATCH_PAY_FILTERED_HINT}
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden">
                <ul className="divide-y divide-gray-100">
                  {filteredShows.map((row) => {
                    const owed = parseAmount(row.owed_total);
                    return (
                      <li key={row.show_id} className="min-w-0 px-4 py-4">
                        <Link
                          href={`/admin/shows/${row.show_id}`}
                          className={`block text-base font-semibold leading-snug ${workspaceRowTitleLink}`}
                        >
                          {row.show_name}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className={`text-sm ${workspaceTableCellMeta}`}>
                            {formatDate(row.show_date)}
                          </span>
                          <span
                            className={`text-lg font-semibold tabular-nums ${workspaceMoneyClassForLiability(owed)}`}
                          >
                            {formatCurrency(owed)}
                          </span>
                        </div>
                        <p className={`mt-1 text-xs ${workspaceTableCellMeta}`}>
                          Owed for this show
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className={workspaceTheadSticky}>
                    <tr>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Show
                      </th>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-left`}
                      >
                        Date
                      </th>
                      <th
                        className={`${workspaceTableHeaderCellPadding} text-right`}
                      >
                        Owed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredShows.map((row) => {
                      const owed = parseAmount(row.owed_total);
                      return (
                        <tr
                          key={row.show_id}
                          className={workspaceTableRowInteractive}
                        >
                          <td
                            className={`whitespace-nowrap text-sm ${workspaceTableBodyCellPadding}`}
                          >
                            <Link
                              href={`/admin/shows/${row.show_id}`}
                              className={workspaceRowTitleLink}
                            >
                              {row.show_name}
                            </Link>
                          </td>
                          <td
                            className={`whitespace-nowrap text-sm text-gray-600 ${workspaceTableBodyCellPadding}`}
                          >
                            {formatDate(row.show_date)}
                          </td>
                          <td
                            className={`whitespace-nowrap text-right text-sm ${workspaceTableBodyCellPadding} ${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(owed)}`}
                          >
                            {formatCurrency(owed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="pb-1">
          <Link
            href="/admin/balances"
            className={`${workspaceActionSecondaryMd} flex w-full justify-center sm:inline-flex sm:w-auto`}
          >
            Back to balances
          </Link>
        </div>
      </div>
    </AdminWorkspacePageLayout>
  );
}
