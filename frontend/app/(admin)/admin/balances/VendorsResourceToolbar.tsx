"use client";

import {
  ArrowDownTrayIcon,
  CreditCardIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import { SETTINGS_ACCOUNTS_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { VENDORS_PAYMENT_LEDGER_HREF } from "@/app/(admin)/admin/_lib/vendorLedgerLinks";
import {
  WORKFLOW_NEW_VENDOR_TRIGGER_LABEL,
  WORKFLOW_VENDORS_ADVANCED_ACCOUNT_SETTINGS,
  WORKFLOW_VENDORS_PAYMENT_LEDGER_LINK,
  WORKFLOW_VENDORS_STATUS_ACTIVE,
  WORKFLOW_VENDORS_STATUS_ALL,
  WORKFLOW_VENDORS_STATUS_ARCHIVED,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionSecondarySm,
  workspaceToolbarSearchInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  VENDORS_ACCOUNT_STATUS_ACTIVE,
  VENDORS_ACCOUNT_STATUS_ALL,
  VENDORS_ACCOUNT_STATUS_ARCHIVED,
  type VendorsAccountStatusFilter,
} from "./vendorsAccountStatusFilter";
import { exportVendorBalancesCsv } from "./exportVendorBalancesCsv";
import {
  VENDORS_PAYMENT_VIEW_ALL,
  type VendorsPaymentView,
} from "./vendorsPaymentView";

type SortKey =
  | "name"
  | "owed_total"
  | "paid_total"
  | "balance_owed"
  | "last_payment_date";

export function VendorsResourceToolbar({
  search,
  onSearchChange,
  paymentView,
  accountStatusFilter,
  onAccountStatusFilterChange,
  sortKey,
  sortDir,
  onNewVendor,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  paymentView: VendorsPaymentView;
  accountStatusFilter: VendorsAccountStatusFilter;
  onAccountStatusFilterChange: (value: VendorsAccountStatusFilter) => void;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onNewVendor: () => void;
}) {
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadCsv = async () => {
    try {
      await exportVendorBalancesCsv({
        search: search.trim(),
        owingOnly: paymentView !== VENDORS_PAYMENT_VIEW_ALL,
        sortKey,
        sortDir,
      });
      setExportError(null);
    } catch {
      setExportError("Balances export failed. Please retry.");
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <div className="overflow-hidden rounded-lg border border-admin-border/90">
        <AdminWorkspaceToolbar
          left={
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder="Search vendors…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${workspaceToolbarSearchInput} min-w-0 w-full sm:max-w-xs md:max-w-sm`}
                aria-label="Search vendors"
              />
              <div className="sm:w-40">
                <WorkspaceNativeSelect
                  aria-label="Filter by vendor status"
                  value={accountStatusFilter}
                  onChange={(e) =>
                    onAccountStatusFilterChange(
                      e.target.value as VendorsAccountStatusFilter,
                    )
                  }
                >
                  <option value={VENDORS_ACCOUNT_STATUS_ACTIVE}>
                    {WORKFLOW_VENDORS_STATUS_ACTIVE}
                  </option>
                  <option value={VENDORS_ACCOUNT_STATUS_ARCHIVED}>
                    {WORKFLOW_VENDORS_STATUS_ARCHIVED}
                  </option>
                  <option value={VENDORS_ACCOUNT_STATUS_ALL}>
                    {WORKFLOW_VENDORS_STATUS_ALL}
                  </option>
                </WorkspaceNativeSelect>
              </div>
            </div>
          }
          right={
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onNewVendor}
                className={`${workspaceActionSecondarySm} gap-1.5`}
              >
                <PlusIcon className={workspaceActionIconMd} aria-hidden />
                {WORKFLOW_NEW_VENDOR_TRIGGER_LABEL}
              </button>
              <a
                href={VENDORS_PAYMENT_LEDGER_HREF}
                className={`${workspaceActionSecondarySm} gap-1.5 no-underline`}
                aria-label="View vendor payment events in Full Ledger"
              >
                <CreditCardIcon className={workspaceActionIconMd} aria-hidden />
                {WORKFLOW_VENDORS_PAYMENT_LEDGER_LINK}
              </a>
              <WorkspaceToolbarMenu
                label="Export"
                leadingIcon={
                  <ArrowDownTrayIcon className={workspaceActionIconMd} />
                }
                menuId="balances-export"
                items={[
                  {
                    id: "balances-csv",
                    label: "Download balances CSV",
                    onSelect: () => {
                      void handleDownloadCsv();
                    },
                  },
                  {
                    id: "advanced-account-settings",
                    label: WORKFLOW_VENDORS_ADVANCED_ACCOUNT_SETTINGS,
                    onSelect: () => {
                      window.location.assign(SETTINGS_ACCOUNTS_HREF);
                    },
                  },
                ]}
              />
            </div>
          }
        />
      </div>
      {exportError != null ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/90 px-4 py-2.5 text-xs text-rose-900"
        >
          <span className="min-w-0 flex-1">{exportError}</span>
          <button
            type="button"
            onClick={() => {
              void handleDownloadCsv();
            }}
            className={workspaceActionSecondarySm}
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}

export type { SortKey as VendorsTableSortKey };
