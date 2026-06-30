"use client";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  WORKFLOW_PURCHASES_CATEGORY_FILTER_LABEL,
  WORKFLOW_PURCHASES_MORE_FILTERS_LABEL,
  WORKFLOW_PURCHASES_VENDOR_FILTER_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionUtilityMd,
  workspaceFormLabelSecondary,
  workspaceToolbarMenuPanel,
} from "@/app/(admin)/admin/_components/workspaceUi";

const MORE_FILTERS_PANEL = [
  workspaceToolbarMenuPanel,
  "left-0 min-w-[14.5rem] origin-top-left p-3",
].join(" ");

function activeFilterCount(
  categoryFilter: string,
  vendorFilter: string,
): number {
  return Number(Boolean(categoryFilter)) + Number(Boolean(vendorFilter));
}

export function PurchasesMoreFiltersMenu({
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  vendorFilter,
  onVendorFilterChange,
  vendorOptions,
}: {
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: readonly string[];
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  vendorOptions: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = activeFilterCount(categoryFilter, vendorFilter);
  const triggerLabel =
    activeCount > 0
      ? `${WORKFLOW_PURCHASES_MORE_FILTERS_LABEL} (${activeCount})`
      : WORKFLOW_PURCHASES_MORE_FILTERS_LABEL;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative hidden shrink-0 sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={workspaceActionUtilityMd}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
      >
        <AdjustmentsHorizontalIcon
          className={workspaceActionIconMd}
          aria-hidden
        />
        {triggerLabel}
        <svg
          className="h-4 w-4 shrink-0 text-stone-500"
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
          role="dialog"
          aria-label={WORKFLOW_PURCHASES_MORE_FILTERS_LABEL}
          className={MORE_FILTERS_PANEL}
        >
          <div className="space-y-3">
            <label className="block min-w-0">
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                {WORKFLOW_PURCHASES_CATEGORY_FILTER_LABEL}
              </span>
              <WorkspaceNativeSelect
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                aria-label={WORKFLOW_PURCHASES_CATEGORY_FILTER_LABEL}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </WorkspaceNativeSelect>
            </label>
            <label className="block min-w-0">
              <span className={`mb-1.5 block ${workspaceFormLabelSecondary}`}>
                {WORKFLOW_PURCHASES_VENDOR_FILTER_LABEL}
              </span>
              <WorkspaceNativeSelect
                value={vendorFilter}
                onChange={(e) => onVendorFilterChange(e.target.value)}
                aria-label={WORKFLOW_PURCHASES_VENDOR_FILTER_LABEL}
              >
                <option value="">All vendors</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </WorkspaceNativeSelect>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Collapsible category + vendor filters for the mobile toolbar stack. */
export function PurchasesMoreFiltersMobile({
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  vendorFilter,
  onVendorFilterChange,
  vendorOptions,
}: {
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: readonly string[];
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  vendorOptions: Array<{ id: string; name: string }>;
}) {
  const activeCount = activeFilterCount(categoryFilter, vendorFilter);

  return (
    <details className="group sm:hidden">
      <summary
        className={`cursor-pointer list-none ${workspaceFormLabelSecondary} [&::-webkit-details-marker]:hidden`}
      >
        <span className="inline-flex items-center gap-1.5">
          {WORKFLOW_PURCHASES_MORE_FILTERS_LABEL}
          {activeCount > 0 ? (
            <span className="text-admin-ink">({activeCount})</span>
          ) : null}
          <svg
            className="h-4 w-4 text-stone-500 transition-transform group-open:rotate-180"
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
        </span>
      </summary>
      <div className="mt-3 grid gap-3">
        <label className="block min-w-0">
          <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
            {WORKFLOW_PURCHASES_CATEGORY_FILTER_LABEL}
          </span>
          <WorkspaceNativeSelect
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label={WORKFLOW_PURCHASES_CATEGORY_FILTER_LABEL}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </WorkspaceNativeSelect>
        </label>
        <label className="block min-w-0">
          <span className={`mb-1 block ${workspaceFormLabelSecondary}`}>
            {WORKFLOW_PURCHASES_VENDOR_FILTER_LABEL}
          </span>
          <WorkspaceNativeSelect
            value={vendorFilter}
            onChange={(e) => onVendorFilterChange(e.target.value)}
            aria-label={WORKFLOW_PURCHASES_VENDOR_FILTER_LABEL}
          >
            <option value="">All vendors</option>
            {vendorOptions.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </WorkspaceNativeSelect>
        </label>
      </div>
    </details>
  );
}
