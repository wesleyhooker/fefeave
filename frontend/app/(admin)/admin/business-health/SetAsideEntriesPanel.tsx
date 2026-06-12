"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { WorkspaceConfirmDialog } from "@/app/(admin)/admin/_components/WorkspaceConfirmDialog";
import {
  WORKFLOW_BH_SET_ASIDE_ENTRIES_EMPTY,
  WORKFLOW_BH_SET_ASIDE_ENTRIES_HEADING,
  WORKFLOW_BH_VOID_SET_ASIDE_CONFIRM,
  WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_DESC,
  WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_TITLE,
  WORKFLOW_BH_VOID_SET_ASIDE_LABEL,
  WORKFLOW_BH_VIEW_LEDGER_ROW,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionSecondarySm,
  workspaceMoneyTabular,
  workspaceTableCellMeta,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { setAsideLedgerHrefForEntry } from "./executionLedgerLinks";
import {
  voidStrategyAllocationEntry,
  type StrategyAllocationEntryDTO,
  type StrategyAllocationType,
} from "@/src/lib/api/strategyAllocations";

function rowLabel(type: StrategyAllocationType): string {
  return type === "TAX_SET_ASIDE" ? "Tax Set Aside" : "Reinvestment";
}

export function SetAsideEntriesPanel({
  entries,
  filterType,
  onChanged,
}: {
  entries: StrategyAllocationEntryDTO[];
  filterType?: StrategyAllocationType;
  onChanged?: () => void;
}) {
  const [voidId, setVoidId] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const visible = entries.filter((e) => {
    if (e.voidedAt) return false;
    if (filterType && e.allocationType !== filterType) return false;
    return true;
  });

  async function confirmVoid() {
    if (!voidId) return;
    setMutating(true);
    try {
      await voidStrategyAllocationEntry(voidId);
      setVoidId(null);
      onChanged?.();
    } finally {
      setMutating(false);
    }
  }

  if (visible.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        {WORKFLOW_BH_SET_ASIDE_ENTRIES_EMPTY}
      </p>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        {WORKFLOW_BH_SET_ASIDE_ENTRIES_HEADING}
      </p>
      <ul className="mt-2 divide-y divide-stone-100 rounded-md border border-stone-200/90 bg-white">
        {visible.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-start justify-between gap-3 px-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">
                {rowLabel(entry.allocationType)}
              </p>
              <p
                className={`mt-0.5 text-base font-semibold text-stone-900 ${workspaceMoneyTabular}`}
              >
                {formatCurrency(Number(entry.amount))}
              </p>
              <p className={`mt-1 ${workspaceTableCellMeta}`}>
                Recorded {formatDate(entry.recordedAt.slice(0, 10))}
                {entry.note ? ` · ${entry.note}` : ""}
              </p>
              <Link
                href={setAsideLedgerHrefForEntry(entry)}
                className="mt-2 inline-block text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                {WORKFLOW_BH_VIEW_LEDGER_ROW}
              </Link>
            </div>
            <button
              type="button"
              disabled={mutating}
              onClick={() => setVoidId(entry.id)}
              className={`${workspaceActionSecondarySm} shrink-0`}
            >
              {WORKFLOW_BH_VOID_SET_ASIDE_LABEL}
            </button>
          </li>
        ))}
      </ul>
      <WorkspaceConfirmDialog
        open={voidId != null}
        onOpenChange={(open) => {
          if (!open) setVoidId(null);
        }}
        title={WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_TITLE}
        description={WORKFLOW_BH_VOID_SET_ASIDE_DIALOG_DESC}
        confirmLabel={WORKFLOW_BH_VOID_SET_ASIDE_CONFIRM}
        onConfirm={confirmVoid}
        tone="stone"
        icon="↺"
      />
    </>
  );
}
