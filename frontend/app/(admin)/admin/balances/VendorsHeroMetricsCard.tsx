"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import {
  WORKSPACE_LABEL_CAPTION,
  WORKSPACE_VALUE_KPI_HERO,
  WORKSPACE_VALUE_STRIP,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { WORKSPACE_ENTITY_HEADER_SHELL } from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL,
  WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL,
  WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL,
  WORKFLOW_VENDORS_OUTSTANDING_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  VENDORS_HERO_BANNER,
  VENDORS_HERO_ILLUSTRATION_SIZES,
  VENDORS_HERO_METRICS_GRID,
  VENDORS_HERO_METRICS_ZONE,
  VENDORS_HERO_SCENE_BLEND,
  VENDORS_HERO_SCENE_IMAGE,
  VENDORS_HERO_SCENE_PANEL,
  VENDORS_HERO_SECONDARY_METRICS,
} from "./vendorsHeroLayout";
import { VENDORS_INDEX_HERO_ILLUSTRATION_SRC } from "./vendorsIndexUi";

export type VendorsObligationSummary = {
  totalOutstanding: number;
  totalOwed: number;
  totalPaid: number;
  vendorsWithBalance: number;
};

function HeroMetric({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center">
      <p
        className={
          valueClassName ?? `${WORKSPACE_VALUE_STRIP} ${workspaceMoneyTabular}`
        }
      >
        {children}
      </p>
      <p className={`mt-0.5 ${WORKSPACE_LABEL_CAPTION}`}>{label}</p>
    </div>
  );
}

/**
 * Vendors index hub hero — warm metrics band + integrated scene art on md+.
 * Mobile: metrics only.
 */
export function VendorsHeroMetricsCard({
  summary,
}: {
  summary: VendorsObligationSummary;
}) {
  return (
    <section
      className={WORKSPACE_ENTITY_HEADER_SHELL}
      aria-label="Vendor obligations summary"
    >
      <div className={VENDORS_HERO_BANNER}>
        <div className={VENDORS_HERO_METRICS_ZONE}>
          <div className={VENDORS_HERO_METRICS_GRID}>
            <HeroMetric
              label={WORKFLOW_VENDORS_OUTSTANDING_LABEL}
              valueClassName={`${WORKSPACE_VALUE_KPI_HERO} ${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(summary.totalOutstanding)}`}
            >
              {formatCurrency(summary.totalOutstanding)}
            </HeroMetric>

            <div className={VENDORS_HERO_SECONDARY_METRICS}>
              <HeroMetric
                label={WORKFLOW_VENDORS_OBLIGATION_VENDORS_OWING_LABEL}
              >
                {summary.vendorsWithBalance}
              </HeroMetric>
              <HeroMetric label={WORKFLOW_VENDORS_OBLIGATION_TOTAL_OWED_LABEL}>
                <span className={workspaceMoneyTabular}>
                  {formatCurrency(summary.totalOwed)}
                </span>
              </HeroMetric>
              <HeroMetric label={WORKFLOW_VENDORS_OBLIGATION_PAID_LABEL}>
                <span className={workspaceMoneyTabular}>
                  {formatCurrency(summary.totalPaid)}
                </span>
              </HeroMetric>
            </div>
          </div>
        </div>

        <div className={VENDORS_HERO_SCENE_PANEL} aria-hidden>
          <Image
            src={VENDORS_INDEX_HERO_ILLUSTRATION_SRC}
            alt=""
            fill
            sizes={VENDORS_HERO_ILLUSTRATION_SIZES}
            className={VENDORS_HERO_SCENE_IMAGE}
          />
          <div className={VENDORS_HERO_SCENE_BLEND} />
        </div>
      </div>
    </section>
  );
}
