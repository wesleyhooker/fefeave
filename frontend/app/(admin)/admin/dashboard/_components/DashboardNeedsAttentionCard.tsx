"use client";

import { formatCurrency } from "@/lib/format";
import type { AttentionItem } from "@/app/(admin)/admin/_lib/workspaceAttentionItems";
import { WORKFLOW_NEEDS_ATTENTION_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceMoneyClassForLiability } from "@/app/(admin)/admin/_components/workspaceUi";
import { DashboardNotificationRow } from "./DashboardNotificationRow";
import {
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardEyebrow,
  dashboardPadX,
  dashboardRowList,
} from "./dashboardStructure";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.06 32.9 32.9 0 003.256.508 3.5 3.5 0 006.972 0 32.933 32.933 0 003.256-.508.75.75 0 00.515-1.06A11.959 11.959 0 0016 8a6 6 0 00-6-6zm0 16a2.5 2.5 0 002.5-2.5h-5A2.5 2.5 0 0010 18z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function severityDotClass(
  severity: "info" | "warning" | "danger" | undefined,
): string {
  switch (severity) {
    case "danger":
      return "bg-rose-400/70";
    case "warning":
      return "bg-amber-300/55";
    case "info":
    default:
      return "bg-stone-400/45";
  }
}

function ErrorRow({
  label,
  message,
  onRetry,
}: {
  label: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <li className={`${dashboardPadX} py-3`}>
      <p className="text-xs font-medium text-rose-900">{label}</p>
      <p className="mt-1 text-xs leading-snug text-rose-800/90">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2.5 rounded-lg border border-rose-200/90 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 shadow-sm transition-colors hover:bg-rose-50"
      >
        Retry
      </button>
    </li>
  );
}

function navigateValueLabel(
  item: Extract<AttentionItem, { kind: "navigate" }>,
): {
  valueLabel: string;
  valueClassName: string;
  ariaLabel?: string;
} {
  if (item.amount != null && item.id === "vendors-owed") {
    const outstandingLabel = formatCurrency(item.amount);
    return {
      valueLabel: outstandingLabel,
      valueClassName: workspaceMoneyClassForLiability(item.amount),
      ariaLabel:
        item.count != null && item.count > 0
          ? `${item.label}: ${outstandingLabel}, ${item.count} vendors`
          : `${item.label}: ${outstandingLabel}`,
    };
  }
  const count = item.count ?? 0;
  return {
    valueLabel: String(count),
    valueClassName: count > 0 ? "text-stone-800" : "text-stone-400",
  };
}

export function DashboardNeedsAttentionCard({
  items,
  onRetry,
}: {
  items: AttentionItem[];
  onRetry: () => void;
}) {
  return (
    <aside
      id="attention"
      className={dashboardModulePanel}
      aria-label={WORKFLOW_NEEDS_ATTENTION_HEADING}
    >
      <div className={dashboardModulePanelHeader}>
        <h2 className={`flex items-center gap-2 ${dashboardEyebrow}`}>
          <BellIcon className="h-3.5 w-3.5 text-stone-500" />
          {WORKFLOW_NEEDS_ATTENTION_HEADING}
        </h2>
      </div>
      <ul className={dashboardRowList}>
        {items.map((item) => {
          if (item.kind === "error") {
            return (
              <ErrorRow
                key={item.id}
                label={item.label}
                message={item.description}
                onRetry={onRetry}
              />
            );
          }
          const { valueLabel, valueClassName, ariaLabel } =
            navigateValueLabel(item);
          return (
            <DashboardNotificationRow
              key={item.id}
              href={item.href}
              iconClassName={severityDotClass(item.severity ?? "info")}
              title={item.label}
              valueLabel={valueLabel}
              valueClassName={valueClassName}
              ariaLabel={ariaLabel}
            />
          );
        })}
      </ul>
    </aside>
  );
}
