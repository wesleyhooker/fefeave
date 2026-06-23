"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { RefObject } from "react";
import {
  WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST,
  WORKFLOW_SHOW_VENDOR_OBLIGATIONS_COMPOSER_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import {
  workspaceActionCompleteMd,
  workspaceActionIconMd,
  workspaceActionIconSm,
  workspaceActionSecondaryMd,
  workspaceActionSecondarySm,
  workspaceTextInputCompact,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency } from "@/lib/format";
import type { BackendWholesalerBalanceRow } from "@/src/lib/api/wholesalers";
import type {
  SettlementComposerBlock,
  SettlementComposerMode,
} from "@/app/(admin)/admin/shows/_lib/showSettlementComposer";
import { settlementComposerBlockMessage } from "@/app/(admin)/admin/shows/_lib/showSettlementComposer";
import { SHOW_DETAIL_OBLIGATIONS_INLINE_PANEL } from "../_lib/showDetailObligationsLayout";

const OBLIGATION_EDITOR_FOOTER_ADD =
  "flex flex-col gap-2.5 border-t border-admin-border/50 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2";

const OBLIGATION_EDITOR_FOOTER_EDIT =
  "flex flex-col-reverse gap-3 border-t border-admin-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

const OBLIGATION_EDITOR_DELETE =
  "border-red-200/90 text-red-800 hover:border-red-300 hover:bg-red-50/80";

type ItemizedLine = {
  id: string;
  itemName: string;
  quantity: string;
  unitPriceDollars: string;
};

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

export function ShowDetailObligationEditor({
  panelRef,
  variant = "add",
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
  creating,
  submitDisabled,
  onSave,
  onCancel,
  onDelete,
}: {
  panelRef?: RefObject<HTMLDivElement | null>;
  variant?: "add" | "edit";
  wholesalers: BackendWholesalerBalanceRow[];
  takenWholesalerIds: Set<string>;
  payoutAfterFees: number;
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
  creating: boolean;
  submitDisabled: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const isEdit = variant === "edit";
  const fieldIdPrefix = isEdit ? "edit-settlement" : "new-settlement";

  const blockMessage = settlementComposerBlock
    ? settlementComposerBlockMessage(settlementComposerBlock)
    : null;

  return (
    <div ref={panelRef} className={SHOW_DETAIL_OBLIGATIONS_INLINE_PANEL}>
      <p className="sr-only">
        {isEdit ? "Edit vendor obligation" : "Add vendor obligation"}
      </p>
      {!isEdit ? (
        <p className="text-xs leading-relaxed text-admin-inkMuted">
          {WORKFLOW_SHOW_VENDOR_OBLIGATIONS_COMPOSER_HINT}
        </p>
      ) : null}
      {submitBlockedMessage && !creating ? (
        <p
          className={`text-xs text-red-600 ${isEdit ? "mt-3" : "mt-2"}`}
          role="status"
        >
          {submitBlockedMessage}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div>
          <label
            htmlFor={`${fieldIdPrefix}-wholesaler`}
            className="mb-1 block text-xs font-medium text-admin-inkMuted"
          >
            Vendor
          </label>
          <WorkspaceNativeSelect
            id={`${fieldIdPrefix}-wholesaler`}
            value={newRowWholesalerId}
            onChange={(e) => onWholesalerChange(e.target.value)}
            className="!h-9 w-full text-sm"
          >
            <option value="">Select vendor</option>
            {wholesalers.map((w) => {
              const taken = takenWholesalerIds.has(w.wholesaler_id);
              return (
                <option
                  key={w.wholesaler_id}
                  value={w.wholesaler_id}
                  disabled={taken}
                >
                  {taken ? `${w.name} (already added)` : w.name}
                </option>
              );
            })}
          </WorkspaceNativeSelect>
          <FieldError
            show={fieldHints.wholesaler && blockMessage != null}
            message={blockMessage ?? ""}
          />
        </div>
        <div>
          <label
            htmlFor={`${fieldIdPrefix}-type`}
            className="mb-1 block text-xs font-medium text-admin-inkMuted"
          >
            Type
          </label>
          <WorkspaceNativeSelect
            id={`${fieldIdPrefix}-type`}
            value={newRowMode}
            onChange={(e) => {
              const v = e.target.value;
              onModeChange(v === "FIXED" || v === "QTY_UNIT" ? v : "PERCENT");
              if (v === "QTY_UNIT" && newRowItemizedLines.length === 0) {
                onItemizedLinesChange(() => [
                  {
                    id: crypto.randomUUID(),
                    itemName: "",
                    quantity: "",
                    unitPriceDollars: "",
                  },
                ]);
              }
            }}
            className="!h-9 w-full text-sm"
          >
            <option value="PERCENT">Percent of payout</option>
            <option value="FIXED">Flat amount</option>
            <option value="QTY_UNIT">Itemized (qty × price)</option>
          </WorkspaceNativeSelect>
        </div>
      </div>

      <div className="mt-3 space-y-3 border-t border-admin-border/50 pt-3">
        {settlementComposerBlock?.kind === "historically_over_payout" ? (
          <p className="text-xs text-red-600" role="status">
            {blockMessage}
          </p>
        ) : null}

        {newRowMode === "PERCENT" ? (
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-admin-inkMuted">
              Percent basis: payout after fees (
              {formatCurrency(payoutAfterFees)}
              ). Percent lines cannot exceed 100% total.
            </p>
            {payoutAfterFees > 0 && totalPercentUsed > 0 ? (
              <p className="text-xs text-admin-inkMuted">
                Already allocated:{" "}
                <span className="font-medium tabular-nums text-admin-ink">
                  {Number.isInteger(totalPercentUsed)
                    ? totalPercentUsed
                    : totalPercentUsed.toFixed(1)}
                  %
                </span>
              </p>
            ) : null}
            <label
              htmlFor={`${fieldIdPrefix}-pct`}
              className="mb-1 block text-xs font-medium text-admin-inkMuted"
            >
              Percent (0–100)
            </label>
            <input
              id={`${fieldIdPrefix}-pct`}
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={newRowPercent}
              onChange={(e) => onPercentChange(e.target.value)}
              className={`w-full max-w-[8rem] ${workspaceTextInputCompact} text-right tabular-nums`}
              placeholder="0"
              aria-invalid={payoutAfterFees > 0 && !isPercentValueValid}
            />
            {payoutAfterFees <= 0 ? (
              <p className="mt-1.5 text-xs text-red-600">
                {WORKFLOW_SHOW_FINANCES_SET_PAYOUT_FIRST}
              </p>
            ) : (
              <FieldError
                show={fieldHints.percent && blockMessage != null}
                message={blockMessage ?? ""}
              />
            )}
            {newRowTotal != null &&
            payoutAfterFees > 0 &&
            !fieldHints.percent ? (
              <p className="text-xs text-admin-inkMuted" role="status">
                {newRowPercent || "0"}% of {formatCurrency(payoutAfterFees)} ={" "}
                <span className="font-medium text-admin-ink">
                  {formatCurrency(newRowTotal)} owed
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {newRowMode === "FIXED" ? (
          <div>
            <label
              htmlFor={`${fieldIdPrefix}-flat`}
              className="mb-1 block text-xs font-medium text-admin-inkMuted"
            >
              Dollar amount owed
            </label>
            <div className="relative max-w-[11rem]">
              <span
                className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-admin-inkMuted"
                aria-hidden
              >
                $
              </span>
              <input
                id={`${fieldIdPrefix}-flat`}
                type="text"
                inputMode="decimal"
                value={newRowFixed}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = v.split(".");
                  if (parts.length > 2) return;
                  if (parts[1]?.length > 2) return;
                  onFixedChange(v);
                }}
                className={`${workspaceTextInputCompact} w-full pl-7 text-right tabular-nums`}
                placeholder="0.00"
              />
            </div>
            <FieldError
              show={fieldHints.flat && blockMessage != null}
              message={blockMessage ?? ""}
            />
            {newRowTotal != null && !fieldHints.flat ? (
              <p className="mt-1.5 text-xs text-admin-inkMuted" role="status">
                {formatCurrency(newRowTotal)} owed
              </p>
            ) : null}
          </div>
        ) : null}

        {newRowMode === "QTY_UNIT" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-admin-inkMuted">
              Line items
            </p>
            <div className="divide-y divide-admin-border/30">
              {newRowItemizedLines.map((line) => (
                <div
                  key={line.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_4.75rem_1.75rem] sm:items-center sm:gap-x-1.5 sm:py-1.5"
                >
                  <input
                    type="text"
                    value={line.itemName}
                    onChange={(e) =>
                      onItemizedLinesChange((prev) =>
                        prev.map((l) =>
                          l.id === line.id
                            ? { ...l, itemName: e.target.value }
                            : l,
                        ),
                      )
                    }
                    placeholder="Item name"
                    className={`min-w-0 w-full sm:w-auto ${workspaceTextInputCompact}`}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <input
                      type="number"
                      step="1"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        onItemizedLinesChange((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, quantity: e.target.value }
                              : l,
                          ),
                        )
                      }
                      placeholder="Qty"
                      className={`${workspaceTextInputCompact} w-full text-right tabular-nums sm:w-auto`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unitPriceDollars}
                      onChange={(e) =>
                        onItemizedLinesChange((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, unitPriceDollars: e.target.value }
                              : l,
                          ),
                        )
                      }
                      placeholder="Price"
                      className={`${workspaceTextInputCompact} w-full text-right tabular-nums sm:w-auto`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onItemizedLinesChange((prev) =>
                        prev.filter((l) => l.id !== line.id),
                      )
                    }
                    className="flex min-h-10 items-center justify-end text-admin-inkMuted hover:text-admin-ink sm:min-h-0"
                    aria-label="Remove item"
                  >
                    <TrashIcon className={workspaceActionIconSm} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                onItemizedLinesChange((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    itemName: "",
                    quantity: "",
                    unitPriceDollars: "",
                  },
                ])
              }
              className={workspaceActionSecondarySm}
            >
              <WorkspaceActionLabel
                icon={<PlusIcon className={workspaceActionIconSm} />}
              >
                Add item
              </WorkspaceActionLabel>
            </button>
            <p className="text-xs text-admin-inkMuted">
              Line total:{" "}
              <span className="font-medium tabular-nums text-admin-ink">
                {newRowTotal != null ? formatCurrency(newRowTotal) : "—"}
              </span>
            </p>
            <FieldError
              show={fieldHints.itemized && blockMessage != null}
              message={blockMessage ?? ""}
            />
          </div>
        ) : null}
      </div>

      <div
        className={
          isEdit ? OBLIGATION_EDITOR_FOOTER_EDIT : OBLIGATION_EDITOR_FOOTER_ADD
        }
      >
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className={`${workspaceActionSecondaryMd} ${OBLIGATION_EDITOR_DELETE} w-full sm:w-auto`}
          >
            <WorkspaceActionLabel
              icon={<TrashIcon className={workspaceActionIconMd} />}
            >
              Delete obligation
            </WorkspaceActionLabel>
          </button>
        ) : null}
        <div
          className={`flex flex-col gap-2 ${onDelete ? "sm:ml-auto sm:flex-row sm:items-center sm:gap-2" : "w-full sm:w-auto sm:flex-row sm:items-center sm:gap-2"}`}
        >
          <button
            type="button"
            onClick={onCancel}
            className={`${workspaceActionSecondaryMd} w-full sm:w-auto`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
            className={`${workspaceActionCompleteMd} w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${isEdit ? "sm:min-w-[10rem]" : ""}`}
          >
            {creating ? "Saving…" : isEdit ? "Save changes" : "Save obligation"}
          </button>
        </div>
      </div>
    </div>
  );
}
