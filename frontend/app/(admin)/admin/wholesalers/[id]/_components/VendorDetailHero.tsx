"use client";

import {
  BanknotesIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/format";
import { VENDORS_INDEX_HERO_ILLUSTRATION_SRC } from "@/app/(admin)/admin/balances/vendorsIndexUi";
import {
  VENDORS_HERO_SCENE_BLEND,
  VENDORS_HERO_SCENE_IMAGE,
} from "@/app/(admin)/admin/balances/vendorsHeroLayout";
import { WorkspaceListPaymentStatus } from "@/app/(admin)/admin/_components/WorkspaceListStatus";
import { getWorkspacePaymentStatus } from "@/app/(admin)/admin/_lib/workspacePaymentStatus";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import { ShowsHeroStatCell } from "@/app/(admin)/admin/shows/_components/ShowsHeroStatCell";
import {
  WORKFLOW_VENDOR_DETAIL_CURRENT_BALANCE_LABEL,
  WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_LABEL,
  WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_NONE,
  WORKFLOW_VENDOR_DETAIL_TOTAL_OWED_LABEL,
  WORKFLOW_VENDOR_DETAIL_TOTAL_PAID_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  VENDOR_DETAIL_HERO_BANNER,
  VENDOR_DETAIL_HERO_BODY,
  VENDOR_DETAIL_HERO_CONTENT_ZONE,
  VENDOR_DETAIL_HERO_IDENTITY,
  VENDOR_DETAIL_HERO_IDENTITY_DETAIL,
  VENDOR_DETAIL_HERO_IDENTITY_STACK,
  VENDOR_DETAIL_HERO_KPI_CELL,
  VENDOR_DETAIL_HERO_KPI_ROW,
  VENDOR_DETAIL_HERO_SCENE_PANEL,
  VENDOR_DETAIL_HERO_SCENE_SIZES,
  VENDOR_DETAIL_HERO_SHELL,
  VENDOR_DETAIL_HERO_STATUS_ROW,
  VENDOR_DETAIL_HERO_TITLE,
} from "../_lib/vendorDetailHeroLayout";

export function VendorDetailHero({
  vendorName,
  balanceOwed,
  totalOwed,
  totalPaid,
  lastPaymentDate,
}: {
  vendorName: string;
  balanceOwed: number;
  totalOwed: number;
  totalPaid: number;
  lastPaymentDate: string | null | undefined;
}) {
  const paymentStatus = getWorkspacePaymentStatus(balanceOwed, totalPaid);
  const title = vendorName || "Vendor";
  const lastPaymentLine = lastPaymentDate
    ? `${WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_LABEL}: ${formatDate(lastPaymentDate)}`
    : `${WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_LABEL}: ${WORKFLOW_VENDOR_DETAIL_LAST_PAYMENT_NONE}`;

  return (
    <section
      className={VENDOR_DETAIL_HERO_SHELL}
      aria-labelledby="vendor-detail-hero-title"
    >
      <div className={VENDOR_DETAIL_HERO_BANNER}>
        <div className={VENDOR_DETAIL_HERO_CONTENT_ZONE}>
          <div className={VENDOR_DETAIL_HERO_BODY}>
            <div
              className={`${VENDOR_DETAIL_HERO_IDENTITY} ${VENDOR_DETAIL_HERO_IDENTITY_STACK}`}
            >
              <h1
                id="vendor-detail-hero-title"
                className={VENDOR_DETAIL_HERO_TITLE}
              >
                {title}
              </h1>
              <div className={VENDOR_DETAIL_HERO_STATUS_ROW}>
                <WorkspaceListPaymentStatus status={paymentStatus} />
              </div>
              <p className={VENDOR_DETAIL_HERO_IDENTITY_DETAIL}>
                {lastPaymentLine}
              </p>
            </div>

            <div className={VENDOR_DETAIL_HERO_KPI_ROW}>
              <div className={VENDOR_DETAIL_HERO_KPI_CELL}>
                <ShowsHeroStatCell
                  label={WORKFLOW_VENDOR_DETAIL_CURRENT_BALANCE_LABEL}
                  value={formatCurrency(balanceOwed)}
                  numericValue={balanceOwed}
                  valueTone="liability"
                  iconWell="liability"
                  icon={
                    <CurrencyDollarIcon className={workspaceActionIconMd} />
                  }
                  lead
                />
              </div>
              <div className={VENDOR_DETAIL_HERO_KPI_CELL}>
                <ShowsHeroStatCell
                  label={WORKFLOW_VENDOR_DETAIL_TOTAL_OWED_LABEL}
                  value={formatCurrency(totalOwed)}
                  numericValue={totalOwed}
                  valueTone="count"
                  iconWell="attention"
                  icon={<DocumentTextIcon className={workspaceActionIconMd} />}
                />
              </div>
              <div className={VENDOR_DETAIL_HERO_KPI_CELL}>
                <ShowsHeroStatCell
                  label={WORKFLOW_VENDOR_DETAIL_TOTAL_PAID_LABEL}
                  value={formatCurrency(totalPaid)}
                  numericValue={totalPaid}
                  valueTone="profit"
                  iconWell="success"
                  icon={<BanknotesIcon className={workspaceActionIconMd} />}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={VENDOR_DETAIL_HERO_SCENE_PANEL} aria-hidden>
          <Image
            src={VENDORS_INDEX_HERO_ILLUSTRATION_SRC}
            alt=""
            fill
            sizes={VENDOR_DETAIL_HERO_SCENE_SIZES}
            className={VENDORS_HERO_SCENE_IMAGE}
          />
          <div className={VENDORS_HERO_SCENE_BLEND} />
        </div>
      </div>
    </section>
  );
}
