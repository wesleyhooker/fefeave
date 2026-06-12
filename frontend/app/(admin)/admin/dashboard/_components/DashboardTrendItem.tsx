"use client";

import {
  workspaceListPrimaryMoneyAmountClass,
  workspaceMoneyClassForLiability,
  workspaceMoneyMuted,
} from "@/app/(admin)/admin/_components/workspaceUi";
import type { DashboardTrendItemModel } from "../_lib/dashboardTrendStrip";
import {
  dashboardTrendDeltaDown,
  dashboardTrendDeltaNeutral,
  dashboardTrendDeltaUp,
  dashboardTrendItemCell,
  dashboardTrendItemHelper,
  dashboardTrendItemLabel,
  dashboardTrendItemValue,
} from "./dashboardStructure";

function deltaClassForDirection(
  direction: NonNullable<DashboardTrendItemModel["delta"]>["direction"],
  itemId: DashboardTrendItemModel["id"],
): string {
  if (direction === "neutral" || direction === "none") {
    return dashboardTrendDeltaNeutral;
  }
  if (itemId === "vendorOutstanding") {
    return direction === "down"
      ? dashboardTrendDeltaUp
      : dashboardTrendDeltaDown;
  }
  return direction === "up" ? dashboardTrendDeltaUp : dashboardTrendDeltaDown;
}

function valueClassForItem(item: DashboardTrendItemModel): string {
  if (item.unavailable) {
    return `text-base font-semibold ${workspaceMoneyMuted}`;
  }
  if (item.valueTone === "profit" && item.numericValue != null) {
    return `text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${workspaceListPrimaryMoneyAmountClass(item.numericValue)}`;
  }
  if (item.valueTone === "liability" && item.numericValue != null) {
    return `text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${workspaceMoneyClassForLiability(item.numericValue)}`;
  }
  return dashboardTrendItemValue;
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
          className={`mt-1 text-xs font-medium leading-snug ${deltaClassForDirection(item.delta.direction, item.id)}`}
          title={item.delta.ariaLabel}
        >
          {item.delta.text}
        </p>
      ) : null}
      <p className={`mt-2 ${dashboardTrendItemHelper}`}>{item.helperText}</p>
    </div>
  );
}
