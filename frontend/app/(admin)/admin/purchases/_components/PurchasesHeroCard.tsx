"use client";

import Image from "next/image";
import {
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/format";
import {
  WORKFLOW_PURCHASES_HERO_BODY,
  WORKFLOW_PURCHASES_HERO_EVENTS_LABEL,
  WORKFLOW_PURCHASES_HERO_EXPENSES_SPEND_LABEL,
  WORKFLOW_PURCHASES_HERO_HEADING,
  WORKFLOW_PURCHASES_HERO_INVENTORY_SPEND_LABEL,
  WORKFLOW_PURCHASES_HERO_VENDORS_LABEL,
  workflowPurchasesHeroMetricDaysLabel,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { ShowsHeroStatCell } from "@/app/(admin)/admin/shows/_components/ShowsHeroStatCell";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  PURCHASES_HERO_BODY,
  PURCHASES_HERO_COPY,
  PURCHASES_HERO_HEADING,
  PURCHASES_HERO_ILLUSTRATION_IMAGE,
  PURCHASES_HERO_ILLUSTRATION_LAYER,
  PURCHASES_HERO_SHELL,
  PURCHASES_HERO_STATS,
  PURCHASES_HERO_STATS_CELL,
  PURCHASES_HERO_STATS_GRID,
  PURCHASES_HERO_VISUAL_BAND,
} from "../_lib/purchasesHeroLayout";
import {
  PURCHASES_HERO_ILLUSTRATION_INTRINSIC,
  PURCHASES_HERO_ILLUSTRATION_SIZES,
  PURCHASES_INDEX_HERO_ILLUSTRATION_SRC,
} from "../_lib/purchasesHeroIllustration";
import {
  percentOfTotal,
  type PurchasesHeroSummary,
} from "../_lib/purchaseActivityModel";

function vendorSubtext(count: number): string {
  if (count === 0) return "No vendors yet";
  return count === 1 ? "1 active vendor" : `${count} active vendors`;
}

function eventsSubtext(count: number): string {
  if (count === 0) return "No purchases recorded";
  return count === 1 ? "1 purchase recorded" : `${count} purchases recorded`;
}

export function PurchasesHeroCard({
  summary,
  days,
}: {
  summary: PurchasesHeroSummary;
  days: number;
}) {
  const totalSpend = summary.inventoryTotal + summary.expensesTotal;
  const inventoryShare = percentOfTotal(summary.inventoryTotal, totalSpend);
  const expensesShare = percentOfTotal(summary.expensesTotal, totalSpend);

  return (
    <section className={PURCHASES_HERO_SHELL} aria-label="Purchases summary">
      <div className={PURCHASES_HERO_VISUAL_BAND}>
        <div className={PURCHASES_HERO_COPY}>
          <h2 className={PURCHASES_HERO_HEADING}>
            {WORKFLOW_PURCHASES_HERO_HEADING}
          </h2>
          <p className={PURCHASES_HERO_BODY}>{WORKFLOW_PURCHASES_HERO_BODY}</p>
        </div>

        <div className={PURCHASES_HERO_ILLUSTRATION_LAYER} aria-hidden>
          <Image
            src={PURCHASES_INDEX_HERO_ILLUSTRATION_SRC}
            alt=""
            width={PURCHASES_HERO_ILLUSTRATION_INTRINSIC.width}
            height={PURCHASES_HERO_ILLUSTRATION_INTRINSIC.height}
            priority
            sizes={PURCHASES_HERO_ILLUSTRATION_SIZES}
            className={PURCHASES_HERO_ILLUSTRATION_IMAGE}
          />
        </div>
      </div>

      <div className={PURCHASES_HERO_STATS}>
        <div className={PURCHASES_HERO_STATS_GRID}>
          <div className={PURCHASES_HERO_STATS_CELL}>
            <ShowsHeroStatCell
              label={workflowPurchasesHeroMetricDaysLabel(
                WORKFLOW_PURCHASES_HERO_INVENTORY_SPEND_LABEL,
                days,
              )}
              valueTone="profit"
              iconWell="success"
              icon={<ShoppingCartIcon className={workspaceActionIconMd} />}
              numericValue={
                summary.inventoryTotal > 0 ? summary.inventoryTotal : null
              }
              value={formatCurrency(summary.inventoryTotal)}
              subtext={`${inventoryShare} of total`}
            />
          </div>
          <div className={PURCHASES_HERO_STATS_CELL}>
            <ShowsHeroStatCell
              label={workflowPurchasesHeroMetricDaysLabel(
                WORKFLOW_PURCHASES_HERO_EXPENSES_SPEND_LABEL,
                days,
              )}
              valueTone="count"
              iconWell="neutral"
              icon={
                <ClipboardDocumentListIcon className={workspaceActionIconMd} />
              }
              value={formatCurrency(summary.expensesTotal)}
              subtext={`${expensesShare} of total`}
            />
          </div>
          <div className={PURCHASES_HERO_STATS_CELL}>
            <ShowsHeroStatCell
              label={WORKFLOW_PURCHASES_HERO_VENDORS_LABEL}
              valueTone="count"
              iconWell="attention"
              icon={
                <BuildingStorefrontIcon className={workspaceActionIconMd} />
              }
              value={summary.vendorCount}
              subtext={vendorSubtext(summary.vendorCount)}
            />
          </div>
          <div className={PURCHASES_HERO_STATS_CELL}>
            <ShowsHeroStatCell
              label={workflowPurchasesHeroMetricDaysLabel(
                WORKFLOW_PURCHASES_HERO_EVENTS_LABEL,
                days,
              )}
              valueTone="count"
              iconWell="neutral"
              icon={<ArchiveBoxIcon className={workspaceActionIconMd} />}
              value={summary.eventCount}
              subtext={eventsSubtext(summary.eventCount)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
