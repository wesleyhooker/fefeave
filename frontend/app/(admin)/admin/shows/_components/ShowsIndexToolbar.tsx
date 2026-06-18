"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import {
  WORKFLOW_SHOWS_INDEX_EXPORT_CSV,
  WORKFLOW_SHOWS_INDEX_EXPORT_LABEL,
  WORKFLOW_SHOWS_INDEX_SEARCH_PLACEHOLDER,
  WORKFLOW_SHOWS_INDEX_STATUS_ALL,
  WORKFLOW_SHOWS_PERIOD_FILTER_EMPTY,
  WORKFLOW_SHOW_STATUS_COMPLETED_LABEL,
  WORKFLOW_SHOW_STATUS_OPEN_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceToolbarSearchInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { exportCurrentPeriodShowsCsv } from "../_lib/exportCurrentPeriodShowsCsv";
import {
  filterShowsIndexEntries,
  SHOWS_INDEX_STATUS_FILTER_ACTIVE,
  SHOWS_INDEX_STATUS_FILTER_ALL,
  SHOWS_INDEX_STATUS_FILTER_COMPLETED,
  SHOWS_INDEX_STATUS_FILTER_PLANNED,
  type ShowsIndexStatusFilter,
} from "../_lib/filterShowsIndexEntries";

export function ShowsIndexToolbar({
  shows,
  summaries,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  shows: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ShowsIndexStatusFilter;
  onStatusFilterChange: (value: ShowsIndexStatusFilter) => void;
}) {
  const [exportError, setExportError] = useState<string | null>(null);

  const filtered = filterShowsIndexEntries(shows, search, statusFilter);

  const handleExport = () => {
    try {
      exportCurrentPeriodShowsCsv(filtered, summaries);
      setExportError(null);
    } catch {
      setExportError("Shows export failed. Please retry.");
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <div className="overflow-visible rounded-lg border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm">
        <AdminWorkspaceToolbar
          left={
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder={WORKFLOW_SHOWS_INDEX_SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${workspaceToolbarSearchInput} min-w-0 w-full sm:max-w-xs md:max-w-sm`}
                aria-label="Search shows"
              />
              <div className="w-full sm:w-auto sm:min-w-[11rem]">
                <WorkspaceNativeSelect
                  aria-label="Filter shows by status"
                  className="w-full min-w-[10.75rem]"
                  value={statusFilter}
                  onChange={(e) =>
                    onStatusFilterChange(
                      e.target.value as ShowsIndexStatusFilter,
                    )
                  }
                >
                  <option value={SHOWS_INDEX_STATUS_FILTER_ALL}>
                    {WORKFLOW_SHOWS_INDEX_STATUS_ALL}
                  </option>
                  <option value={SHOWS_INDEX_STATUS_FILTER_ACTIVE}>
                    {WORKFLOW_SHOW_STATUS_OPEN_LABEL}
                  </option>
                  <option value={SHOWS_INDEX_STATUS_FILTER_PLANNED}>
                    Planned
                  </option>
                  <option value={SHOWS_INDEX_STATUS_FILTER_COMPLETED}>
                    {WORKFLOW_SHOW_STATUS_COMPLETED_LABEL}
                  </option>
                </WorkspaceNativeSelect>
              </div>
            </div>
          }
          right={
            <WorkspaceToolbarMenu
              label={WORKFLOW_SHOWS_INDEX_EXPORT_LABEL}
              leadingIcon={
                <ArrowDownTrayIcon className={workspaceActionIconMd} />
              }
              menuId="shows-export"
              items={[
                {
                  id: "shows-csv",
                  label: WORKFLOW_SHOWS_INDEX_EXPORT_CSV,
                  onSelect: handleExport,
                },
              ]}
            />
          }
        />
      </div>
      {filtered.length === 0 && shows.length > 0 ? (
        <p className="px-1 text-sm text-admin-inkMuted" role="status">
          {WORKFLOW_SHOWS_PERIOD_FILTER_EMPTY}
        </p>
      ) : null}
      {exportError != null ? (
        <p className="px-1 text-sm text-admin-semanticLiability" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}

export { filterShowsIndexEntries };
