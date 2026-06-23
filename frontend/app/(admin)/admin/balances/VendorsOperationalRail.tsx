"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  WorkspaceCard,
  WorkspaceCardBody,
  WorkspaceCardHeader,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import {
  WORKFLOW_VENDORS_RAIL_RECENT_ACTIVITY_HEADING,
  workflowVendorLastPaidLabel,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import type { WholesalerBalanceRow } from "./BalancesTable";
import { VendorsRecentPaymentsRailEmptyState } from "./VendorsRecentPaymentsRailEmptyState";
import { buildVendorsRailRecentPayments } from "./vendorsRailInsights";
import { VENDORS_INDEX_LAYOUT_RAIL } from "./vendorsIndexLayout";

export function VendorsOperationalRail({
  data,
}: {
  data: WholesalerBalanceRow[];
}) {
  const recent = useMemo(() => buildVendorsRailRecentPayments(data), [data]);

  return (
    <aside
      aria-label="Vendor workflow support"
      className={VENDORS_INDEX_LAYOUT_RAIL}
    >
      <WorkspaceCard aria-label={WORKFLOW_VENDORS_RAIL_RECENT_ACTIVITY_HEADING}>
        <WorkspaceCardHeader
          title={WORKFLOW_VENDORS_RAIL_RECENT_ACTIVITY_HEADING}
        />
        <WorkspaceCardBody className="pt-3">
          {recent.length === 0 ? (
            <VendorsRecentPaymentsRailEmptyState />
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {recent.map((row) => (
                <li key={row.id}>
                  <Link
                    href={vendorDetailHref(row.id)}
                    className="block text-sm leading-snug hover:underline"
                  >
                    <span className="font-medium text-stone-900">
                      {row.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-600">
                      {workflowVendorLastPaidLabel(row.lastPaymentDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCardBody>
      </WorkspaceCard>
    </aside>
  );
}
