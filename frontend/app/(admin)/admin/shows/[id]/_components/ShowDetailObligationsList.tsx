"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import type { RefObject } from "react";
import {
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_HINT,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_TITLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import type { BackendWholesalerBalanceRow } from "@/src/lib/api/wholesalers";
import type {
  SettlementComposerBlock,
  SettlementComposerMode,
} from "@/app/(admin)/admin/shows/_lib/showSettlementComposer";
import type {
  ShowDetailObligationRowModel,
  ShowDetailObligationsPanel,
} from "../_lib/showDetailObligationModel";
import {
  SHOW_DETAIL_OBLIGATIONS_ADD_ROW,
  SHOW_DETAIL_OBLIGATIONS_EMPTY,
  SHOW_DETAIL_OBLIGATIONS_LIST,
} from "../_lib/showDetailObligationsLayout";
import { ShowDetailObligationEditor } from "./ShowDetailObligationEditor";
import { ShowDetailObligationEntityRow } from "./ShowDetailObligationEntityRow";

type ItemizedLine = {
  id: string;
  itemName: string;
  quantity: string;
  unitPriceDollars: string;
};

export function ShowDetailObligationsList({
  settlements,
  payoutAfterFees,
  isClosed,
  panel,
  onOpenAdd,
  onOpenEdit,
  onClosePanel,
  onDelete,
  amountOwedFor,
  addPanelRef,
  editPanelRef,
  wholesalers,
  takenWholesalerIds,
  totalPercentUsed,
  newRowWholesalerId,
  onWholesalerChange,
  newRowMode,
  onModeChange,
  newRowPercent,
  onPercentChange,
  newRowFixed,
  onFixedChange,
  newRowItemizedLines,
  onItemizedLinesChange,
  newRowTotal,
  isPercentValueValid,
  settlementComposerBlock,
  fieldHints,
  submitBlockedMessage,
  saving,
  submitDisabled,
  onSave,
}: {
  settlements: ShowDetailObligationRowModel[];
  payoutAfterFees: number;
  isClosed: boolean;
  panel: ShowDetailObligationsPanel;
  onOpenAdd: () => void;
  onOpenEdit: (settlementId: string) => void;
  onClosePanel: () => void;
  onDelete: (settlementId: string) => void;
  amountOwedFor: (payout: number, row: ShowDetailObligationRowModel) => number;
  addPanelRef: RefObject<HTMLDivElement | null>;
  editPanelRef: RefObject<HTMLDivElement | null>;
  wholesalers: BackendWholesalerBalanceRow[];
  takenWholesalerIds: Set<string>;
  totalPercentUsed: number;
  newRowWholesalerId: string;
  onWholesalerChange: (id: string) => void;
  newRowMode: SettlementComposerMode;
  onModeChange: (mode: SettlementComposerMode) => void;
  newRowPercent: string;
  onPercentChange: (value: string) => void;
  newRowFixed: string;
  onFixedChange: (value: string) => void;
  newRowItemizedLines: ItemizedLine[];
  onItemizedLinesChange: (
    updater: (prev: ItemizedLine[]) => ItemizedLine[],
  ) => void;
  newRowTotal: number | null;
  isPercentValueValid: boolean;
  settlementComposerBlock: SettlementComposerBlock | null;
  fieldHints: {
    wholesaler: boolean;
    percent: boolean;
    flat: boolean;
    itemized: boolean;
  };
  submitBlockedMessage: string | null;
  saving: boolean;
  submitDisabled: boolean;
  onSave: () => void;
}) {
  const editSettlementId = panel.kind === "edit" ? panel.settlementId : null;
  const addOpen = panel.kind === "add";

  const editorProps = {
    wholesalers,
    takenWholesalerIds,
    payoutAfterFees,
    totalPercentUsed,
    newRowWholesalerId,
    onWholesalerChange,
    newRowMode,
    onModeChange,
    newRowPercent,
    onPercentChange,
    newRowFixed,
    onFixedChange,
    newRowItemizedLines,
    onItemizedLinesChange,
    newRowTotal,
    isPercentValueValid,
    settlementComposerBlock,
    fieldHints,
    submitBlockedMessage,
    creating: saving,
    submitDisabled,
    onSave,
    onCancel: onClosePanel,
  };

  const showEmptyCopy =
    settlements.length === 0 && !addOpen && panel.kind === "closed";

  return (
    <div>
      {showEmptyCopy ? (
        <div className={SHOW_DETAIL_OBLIGATIONS_EMPTY}>
          <p className="text-sm text-admin-ink">
            {WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_TITLE}
          </p>
          <p className="text-sm leading-relaxed text-admin-inkMuted">
            {WORKFLOW_SHOW_VENDOR_OBLIGATIONS_EMPTY_HINT}
          </p>
        </div>
      ) : null}

      <div
        className={
          settlements.length > 0 || addOpen ? SHOW_DETAIL_OBLIGATIONS_LIST : ""
        }
      >
        {settlements.map((row) => {
          const owed = amountOwedFor(payoutAfterFees, row);
          if (editSettlementId === row.id) {
            return (
              <ShowDetailObligationEditor
                key={row.id}
                {...editorProps}
                variant="edit"
                panelRef={editPanelRef}
                onDelete={() => onDelete(row.id)}
              />
            );
          }
          return (
            <ShowDetailObligationEntityRow
              key={row.id}
              row={row}
              amountOwed={owed}
              isClosed={isClosed}
              isEditing={false}
              onOpenEdit={() => onOpenEdit(row.id)}
            />
          );
        })}

        {!isClosed && addOpen ? (
          <ShowDetailObligationEditor
            {...editorProps}
            variant="add"
            panelRef={addPanelRef}
          />
        ) : null}

        {!isClosed && !addOpen && !editSettlementId ? (
          <button
            type="button"
            onClick={onOpenAdd}
            className={SHOW_DETAIL_OBLIGATIONS_ADD_ROW}
            aria-expanded={false}
            aria-label="Add vendor obligation"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-admin-border/80 bg-admin-mutedStrip/30 text-admin-inkMuted"
              aria-hidden
            >
              <PlusIcon className={workspaceActionIconMd} />
            </span>
            <span className="min-w-0 flex-1 text-left text-sm font-medium text-admin-inkMuted transition-colors group-hover:text-admin-ink">
              Add obligation
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
