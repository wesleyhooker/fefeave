"use client";

import {
  WORKSPACE_LABEL_CAPTION,
  WORKSPACE_TREND_ITEM_VALUE,
  WORKSPACE_TREND_NEGATIVE,
  WORKSPACE_TREND_NEUTRAL,
  WORKSPACE_TREND_POSITIVE,
} from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { DashboardTrendItemModel } from "../_lib/dashboardTrendStrip";
import {
  dashboardTrendItemCell,
  dashboardTrendItemHelper,
  dashboardTrendItemLabel,
} from "./dashboardStructure";

function deltaClassForDirection(
  direction: NonNullable<DashboardTrendItemModel["delta"]>["direction"],
  itemId: DashboardTrendItemModel["id"],
): string {
  if (direction === "neutral" || direction === "none") {
    return WORKSPACE_TREND_NEUTRAL;
  }
  if (itemId === "vendorOutstanding") {
    return direction === "down"
      ? WORKSPACE_TREND_POSITIVE
      : WORKSPACE_TREND_NEGATIVE;
  }
  return direction === "up"
    ? WORKSPACE_TREND_POSITIVE
    : WORKSPACE_TREND_NEGATIVE;
}

function valueClassForItem(item: DashboardTrendItemModel): string {
  if (item.unavailable) {
    return `text-base font-semibold ${workspaceMoneyMuted}`;
  }
  if (item.valueTone === "profit" && item.numericValue != null) {
    return `${WORKSPACE_TREND_ITEM_VALUE} ${workspaceListPrimaryMoneyAmountClass(item.numericValue)}`;
  }
  if (item.valueTone === "liability" && item.numericValue != null) {
    return `${WORKSPACE_TREND_ITEM_VALUE} ${workspaceMoneyClassForLiability(item.numericValue)}`;
  }
  return WORKSPACE_TREND_ITEM_VALUE;
}

export function DashboardTrendItem({
  item,
}: {
  item: DashboardTrendItemModel;
}) {
  return (
    <div className={dashboardTrendItemCell}>
      <p className={dashboardTrendItemLabel}>{item.label}</p>
      <p className={`mt-1 ${valueClassForItem(item)}`}>{item.value}</p>
      {item.delta != null ? (
        <p
          className={`mt-1 ${WORKSPACE_LABEL_CAPTION} ${deltaClassForDirection(item.delta.direction, item.id)}`}
          title={item.delta.ariaLabel}
        >
          {item.delta.text}
        </p>
      ) : null}
      <p className={`mt-2 ${dashboardTrendItemHelper}`}>{item.helperText}</p>
    </div>
  );
}
