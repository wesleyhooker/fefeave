"use client";

import {
  dashboardEyebrow,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
  dashboardRowList,
} from "./dashboardStructure";
import { DashboardNotificationRow } from "./DashboardNotificationRow";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.06 32.9 32.9 0 003.256.508 3.5 3.5 0 006.972 0 32.933 32.933 0 003.256-.508.75.75 0 00.515-1.06A11.959 11.959 0 0016 8a6 6 0 00-6-6zm0 16a2.5 2.5 0 002.5-2.5h-5A2.5 2.5 0 0010 18z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ErrorRow({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <li className={`${dashboardPadX} py-3`}>
      <p className="text-xs font-medium text-rose-900">Data issue</p>
      <p className="mt-1 text-xs leading-snug text-rose-800/90">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2.5 rounded-lg border border-rose-200/90 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 shadow-sm transition-colors hover:bg-rose-50"
      >
        Retry
      </button>
    </li>
  );
}

export function DashboardNotificationsCard({
  showsError,
  balancesError,
  onRetry,
  openShowsCount,
  vendorsOwingCount,
}: {
  showsError: string | null;
  balancesError: string | null;
  onRetry: () => void;
  openShowsCount: number;
  vendorsOwingCount: number;
}) {
  return (
    <aside className={dashboardModulePanel} aria-label="Notifications">
      <div className={dashboardModulePanelHeader}>
        <h2 className={`flex items-center gap-2 ${dashboardEyebrow}`}>
          <BellIcon className="h-3.5 w-3.5 text-gray-400" />
          Notifications
        </h2>
      </div>
      <ul className={dashboardRowList}>
        {showsError != null ? (
          <ErrorRow message={showsError} onRetry={onRetry} />
        ) : null}
        {balancesError != null ? (
          <ErrorRow message={balancesError} onRetry={onRetry} />
        ) : null}
        <DashboardNotificationRow
          href="/admin/shows"
          iconClassName="bg-sky-400/75"
          title="Open shows"
          valueLabel={String(openShowsCount)}
          valueClassName={openShowsCount > 0 ? "text-sky-900" : "text-gray-400"}
        />
        <DashboardNotificationRow
          href="/admin/balances"
          iconClassName="bg-amber-400/55"
          title="Vendors with balance"
          valueLabel={String(vendorsOwingCount)}
          valueClassName={
            vendorsOwingCount > 0 ? "text-rose-800/90" : "text-gray-400"
          }
        />
      </ul>
    </aside>
  );
}
