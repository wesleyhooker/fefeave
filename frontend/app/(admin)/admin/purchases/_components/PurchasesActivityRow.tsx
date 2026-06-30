"use client";

import Link from "next/link";
import {
  ArchiveBoxIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORKFLOW_PURCHASES_PAYMENT_PAID_BADGE,
  WORKFLOW_PURCHASES_PAYMENT_UNPAID_BADGE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { vendorDetailHref } from "@/app/(admin)/admin/_lib/vendorRoutes";
import { WorkspaceIconWell } from "@/app/(admin)/admin/_components/workspace/WorkspaceIconWell";
import {
  workspaceMoneyTabular,
  workspaceRowTitleLink,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { PurchaseActivityItem } from "../_lib/purchaseActivityModel";
import {
  PURCHASES_FEED_ROW,
  PURCHASES_FEED_ROW_AMOUNT,
  PURCHASES_FEED_ROW_ICON,
  PURCHASES_FEED_ROW_MAIN,
  PURCHASES_FEED_ROW_META,
  PURCHASES_FEED_ROW_PURCHASE,
  PURCHASES_FEED_ROW_TITLE,
  PURCHASES_FEED_ROW_TYPE,
  PURCHASES_FEED_ROW_VENDOR,
} from "../_lib/purchasesFeedLayout";

function categoryBadgeClass(kind: PurchaseActivityItem["kind"]): string {
  if (kind === "inventory") {
    return "inline-flex max-w-full items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800";
  }
  return "inline-flex max-w-full items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-900";
}

function paymentBadgeClass(
  status: PurchaseActivityItem["paymentStatus"],
): string {
  if (status === "OWE_VENDOR") {
    return "inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-900";
  }
  return "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800";
}

function rowIcon(item: PurchaseActivityItem) {
  if (item.kind === "expense") {
    if (item.category === "Shipping") {
      return <TruckIcon className="h-5 w-5" aria-hidden />;
    }
    if (item.category === "Supplies" || item.category === "Equipment") {
      return <ArchiveBoxIcon className="h-5 w-5" aria-hidden />;
    }
    return <BuildingOffice2Icon className="h-5 w-5" aria-hidden />;
  }
  return <ArchiveBoxIcon className="h-5 w-5" aria-hidden />;
}

function iconWellVariant(item: PurchaseActivityItem) {
  return item.kind === "inventory" ? "success" : "neutral";
}

function VendorCell({
  label,
  vendorId,
}: {
  label: string | null;
  vendorId: string | null;
}) {
  if (!label?.trim()) {
    return <span className="text-sm text-admin-inkMuted">—</span>;
  }
  if (vendorId) {
    return (
      <Link href={vendorDetailHref(vendorId)} className={workspaceRowTitleLink}>
        {label}
      </Link>
    );
  }
  return <span className={PURCHASES_FEED_ROW_VENDOR}>{label}</span>;
}

export function PurchasesActivityRow({ item }: { item: PurchaseActivityItem }) {
  return (
    <li className={PURCHASES_FEED_ROW}>
      <div className={`${PURCHASES_FEED_ROW_PURCHASE} md:col-span-1`}>
        <span className={PURCHASES_FEED_ROW_ICON}>
          <WorkspaceIconWell variant={iconWellVariant(item)}>
            {rowIcon(item)}
          </WorkspaceIconWell>
        </span>
        <div className={PURCHASES_FEED_ROW_MAIN}>
          <p className={PURCHASES_FEED_ROW_TYPE}>{item.typeLabel}</p>
          <p className={PURCHASES_FEED_ROW_TITLE}>{item.title}</p>
          <p className={`${PURCHASES_FEED_ROW_META} md:hidden`}>
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{formatDate(item.date)}</span>
            {item.vendorLabel ? (
              <>
                <span aria-hidden className="text-admin-border">
                  ·
                </span>
                <span className="min-w-0 truncate">{item.vendorLabel}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 md:block">
        <VendorCell label={item.vendorLabel} vendorId={item.vendorId} />
      </div>

      <div className="min-w-0">
        {item.category ? (
          <span className={categoryBadgeClass(item.kind)}>{item.category}</span>
        ) : (
          <span className="text-sm text-admin-inkMuted">—</span>
        )}
      </div>

      <div className="min-w-0 md:text-right">
        <p className={`${PURCHASES_FEED_ROW_AMOUNT} ${workspaceMoneyTabular}`}>
          {formatCurrency(item.amount)}
        </p>
        <p className="mt-0.5 text-xs text-admin-inkMuted md:hidden">
          {item.kind === "inventory"
            ? item.paymentStatus === "OWE_VENDOR"
              ? WORKFLOW_PURCHASES_PAYMENT_UNPAID_BADGE
              : WORKFLOW_PURCHASES_PAYMENT_PAID_BADGE
            : "—"}
        </p>
      </div>

      <div className="hidden min-w-[4.5rem] md:block md:text-right">
        {item.kind === "inventory" ? (
          <span className={paymentBadgeClass(item.paymentStatus)}>
            {item.paymentStatus === "OWE_VENDOR"
              ? WORKFLOW_PURCHASES_PAYMENT_UNPAID_BADGE
              : WORKFLOW_PURCHASES_PAYMENT_PAID_BADGE}
          </span>
        ) : (
          <span className="text-sm text-admin-inkMuted">—</span>
        )}
      </div>
    </li>
  );
}
