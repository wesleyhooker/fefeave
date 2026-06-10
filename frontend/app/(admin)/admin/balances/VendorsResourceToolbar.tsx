"use client";

import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { AdminWorkspaceToolbar } from "@/app/(admin)/admin/_components/AdminWorkspaceToolbar";
import { WorkspaceToolbarMenu } from "@/app/(admin)/admin/_components/WorkspaceToolbarMenu";
import {
  LEDGER_HREF,
  BUSINESS_HEALTH_HREF,
  SETTINGS_ACCOUNTS_HREF,
} from "@/app/(admin)/admin/_lib/adminSidebarNav";
import { WORKFLOW_NEW_VENDOR_TRIGGER_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionSecondarySm,
  workspaceActionUtilityMd,
  workspaceToolbarSearchInput,
} from "@/app/(admin)/admin/_components/workspaceUi";
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
  sortKey,
  sortDir,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  paymentView: VendorsPaymentView;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
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
            <input
              type="search"
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`${workspaceToolbarSearchInput} min-w-0 w-full sm:max-w-xs md:max-w-sm`}
              aria-label="Search vendors"
            />
          }
          right={
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Link
                href={`${SETTINGS_ACCOUNTS_HREF}?add=1`}
                className={`${workspaceActionSecondarySm} gap-1.5`}
              >
                <PlusIcon className={workspaceActionIconMd} aria-hidden />
                {WORKFLOW_NEW_VENDOR_TRIGGER_LABEL}
              </Link>
              <Link
                href={`${LEDGER_HREF}?type=payment`}
                className={`${workspaceActionSecondarySm} gap-1.5`}
                aria-label="View payment activity in ledger"
              >
                <CreditCardIcon className={workspaceActionIconMd} aria-hidden />
                Payment ledger
              </Link>
              <Link
                href={BUSINESS_HEALTH_HREF}
                className={`${workspaceActionSecondarySm} gap-1.5`}
                aria-label="Business Health"
              >
                <BanknotesIcon className={workspaceActionIconMd} aria-hidden />
                Business Health
              </Link>
              <Link
                href={SETTINGS_ACCOUNTS_HREF}
                className={workspaceActionUtilityMd}
                aria-label="People and accounts settings"
              >
                <Cog6ToothIcon className={workspaceActionIconMd} />
                Manage accounts
              </Link>
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
