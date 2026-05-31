"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import {
  AdminSummaryStatGrid,
  type AdminSummaryStatItem,
} from "@/app/(admin)/admin/_components/AdminSummaryStatGrid";
import { WorkspaceInlineError } from "@/app/(admin)/admin/_components/WorkspaceInlineError";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { FinancialsCrossLinks } from "@/app/(admin)/admin/_components/FinancialsCrossLinks";
import { FINANCIALS_OVERVIEW_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  fetchFinancialActivity,
  fetchFinancialActivityStats,
  FINANCIAL_EVENT_CATEGORY_OPTIONS,
  FINANCIAL_EVENT_TYPE_OPTIONS,
  type FinancialActivityEventDTO,
  type FinancialActivityStatsResponse,
  type FinancialEventCategory,
  type FinancialEventType,
} from "@/src/lib/api/financial-activity";
import {
  ACTIVITY_LEDGER_HEALTH_ITEMS,
  formatActivityCategoryLabel,
} from "@/src/lib/financial-activity-display";
import {
  workspaceActionSecondarySm,
  workspaceCard,
  workspaceDateInput,
  workspaceFormLabelSecondary,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";

function amountLineClass(direction: string | null): string {
  if (direction === "INFLOW") return "text-emerald-700";
  if (direction === "OUTFLOW") return "text-rose-700";
  return "text-stone-800";
}

function ActivityTimelineRow({ event }: { event: FinancialActivityEventDTO }) {
  return (
    <li className="border-b border-stone-100 py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900">
            {event.display_title}
          </p>
          {event.display_amount_line ? (
            <p
              className={`mt-0.5 text-base font-semibold tabular-nums ${amountLineClass(event.direction)}`}
            >
              {event.display_amount_line}
            </p>
          ) : null}
          {event.payload_summary &&
          event.payload_summary !== event.display_amount_line ? (
            <p className="mt-1 text-sm text-stone-600">
              {event.payload_summary}
            </p>
          ) : null}
          <p className={`mt-2 ${workspaceTableCellMeta}`}>
            Effective{" "}
            {event.effective_date ? formatDate(event.effective_date) : "—"}
            {" · "}
            Recorded {formatDate(event.occurred_at.slice(0, 10))}
            {" · "}
            {formatActivityCategoryLabel(event.event_category)}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function FinancialActivityPage() {
  const [events, setEvents] = useState<FinancialActivityEventDTO[]>([]);
  const [stats, setStats] = useState<FinancialActivityStatsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const [category, setCategory] = useState<FinancialEventCategory | "">("");
  const [eventType, setEventType] = useState<FinancialEventType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  function resetPageForFilterChange() {
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [list, statsResponse] = await Promise.all([
          fetchFinancialActivity({
            page,
            limit: 50,
            event_category: category || undefined,
            event_type: eventType || undefined,
            effective_date_from: dateFrom || undefined,
            effective_date_to: dateTo || undefined,
          }),
          fetchFinancialActivityStats(),
        ]);
        if (cancelled) return;
        setEvents(list.items);
        setTotalPages(list.pagination.total_pages);
        setTotalEvents(list.pagination.total);
        setStats(statsResponse);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, category, eventType, dateFrom, dateTo, reloadToken]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setReloadToken((t) => t + 1);
  }

  function clearFilters() {
    setCategory("");
    setEventType("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setReloadToken((t) => t + 1);
  }

  const statItems = useMemo((): AdminSummaryStatItem[] => {
    if (!stats) {
      return [
        { id: "total-events", label: "Total events", value: "—" },
        { id: "events-30d", label: "Last 30 days", value: "—" },
      ];
    }
    const categoryLines = stats.events_by_category
      .map(
        (row) => `${formatActivityCategoryLabel(row.category)}: ${row.count}`,
      )
      .join(" · ");
    return [
      {
        id: "total-events",
        label: "Total events",
        value: String(stats.total_events),
      },
      {
        id: "events-30d",
        label: "Events last 30 days",
        value: String(stats.events_last_30_days),
      },
      {
        id: "by-category",
        label: "By category",
        value: categoryLines || "None yet",
      },
    ];
  }, [stats]);

  return (
    <AdminWorkspacePageLayout
      intro={
        <AdminWorkspacePageIntro
          title="Activity"
          subtitle="What happened financially — a ledger-driven timeline from financial events. Read-only; does not change recommendations or cash calculations."
        />
      }
    >
      <FinancialsCrossLinks
        links={[{ href: FINANCIALS_OVERVIEW_HREF, label: "Overview" }]}
        className="mb-4"
      />

      {error ? (
        <WorkspaceInlineError
          title="Could not load financial activity."
          message={error}
          onRetry={() => setReloadToken((t) => t + 1)}
          className="mb-4"
        />
      ) : null}

      <section aria-labelledby="activity-stats-heading" className="mb-6">
        <h2
          id="activity-stats-heading"
          className="mb-3 text-sm font-semibold text-stone-900"
        >
          All ledger statistics
        </h2>
        <p className="mb-3 text-sm text-stone-600">
          Counts for the full event ledger. Timeline filters below do not change
          these totals.
        </p>
        <AdminSummaryStatGrid
          items={statItems}
          aria-label="All ledger statistics"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section
            aria-labelledby="activity-filters-heading"
            className={workspaceCard}
          >
            <h2
              id="activity-filters-heading"
              className="text-sm font-semibold text-stone-900"
            >
              Filters
            </h2>
            <form
              onSubmit={applyFilters}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="activity-category"
                  className={workspaceFormLabelSecondary}
                >
                  Category
                </label>
                <WorkspaceNativeSelect
                  id="activity-category"
                  value={category}
                  onChange={(e) => {
                    resetPageForFilterChange();
                    setCategory(e.target.value as FinancialEventCategory | "");
                  }}
                >
                  {FINANCIAL_EVENT_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </div>
              <div>
                <label
                  htmlFor="activity-event-type"
                  className={workspaceFormLabelSecondary}
                >
                  Event type
                </label>
                <WorkspaceNativeSelect
                  id="activity-event-type"
                  value={eventType}
                  onChange={(e) => {
                    resetPageForFilterChange();
                    setEventType(e.target.value as FinancialEventType | "");
                  }}
                >
                  {FINANCIAL_EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </WorkspaceNativeSelect>
              </div>
              <div>
                <label
                  htmlFor="activity-date-from"
                  className={workspaceFormLabelSecondary}
                >
                  Effective from
                </label>
                <input
                  id="activity-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    resetPageForFilterChange();
                    setDateFrom(e.target.value);
                  }}
                  className={workspaceDateInput}
                />
              </div>
              <div>
                <label
                  htmlFor="activity-date-to"
                  className={workspaceFormLabelSecondary}
                >
                  Effective to
                </label>
                <input
                  id="activity-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    resetPageForFilterChange();
                    setDateTo(e.target.value);
                  }}
                  className={workspaceDateInput}
                />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                <button type="submit" className={workspaceActionSecondarySm}>
                  Apply filters
                </button>
                <button
                  type="button"
                  className={workspaceActionSecondarySm}
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section
            aria-labelledby="activity-timeline-heading"
            className={workspaceCard}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="activity-timeline-heading"
                className="text-sm font-semibold text-stone-900"
              >
                Activity timeline
              </h2>
              <p
                className={`${workspaceTableCellMeta} ${workspaceMoneyTabular}`}
              >
                {totalEvents} event{totalEvents === 1 ? "" : "s"}
              </p>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-stone-500">Loading activity…</p>
            ) : events.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">
                No financial events match these filters yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100">
                {events.map((event) => (
                  <ActivityTimelineRow key={event.id} event={event} />
                ))}
              </ul>
            )}

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  className={workspaceActionSecondarySm}
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={workspaceActionSecondarySm}
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <aside
          aria-labelledby="ledger-health-heading"
          className={workspaceCard}
        >
          <h2
            id="ledger-health-heading"
            className="text-sm font-semibold text-stone-900"
          >
            Ledger health
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Known ledger limitations — informational only.
          </p>
          <ul className="mt-4 space-y-4">
            {ACTIVITY_LEDGER_HEALTH_ITEMS.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <p className="text-sm font-medium text-stone-900">
                  {item.label}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-800">
                  {item.status}
                </p>
                <p className="mt-2 text-sm text-stone-600">{item.detail}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AdminWorkspacePageLayout>
  );
}
