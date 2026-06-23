"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  settlementMethodHint,
  settlementMethodPrimaryLabel,
  calculationMethodFromStructuredType,
} from "@/app/(admin)/admin/_lib/settlementUi";
import {
  workspaceMoneyClassForLiability,
  workspaceMoneyTabular,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { formatCurrency } from "@/lib/format";
import type { ShowDetailObligationRowModel } from "../_lib/showDetailObligationModel";
import {
  SHOW_DETAIL_OBLIGATION_ENTITY_ROW,
  SHOW_DETAIL_OBLIGATION_ENTITY_ROW_STATIC,
} from "../_lib/showDetailObligationsLayout";
import {
  SHOW_DETAIL_VENDOR_AVATAR,
  vendorAvatarToneClass,
  vendorInitials,
} from "../_lib/showDetailVendorAvatar";

function ObligationEntityRowContent({
  row,
  amountOwed,
  isClosed,
  isEditing,
}: {
  row: ShowDetailObligationRowModel;
  amountOwed: number;
  isClosed: boolean;
  isEditing: boolean;
}) {
  const calcMethod = calculationMethodFromStructuredType(row.type);
  const typeLabel = settlementMethodPrimaryLabel(calcMethod);
  const summaryHint = settlementMethodHint({
    calculationMethod: calcMethod,
    percentOfPayout: row.type === "PERCENT" ? row.percent : undefined,
    lineCount: row.type === "ITEMIZED" ? row.lines?.length : undefined,
  });
  const methodSummary = summaryHint
    ? `${typeLabel} · ${summaryHint}`
    : typeLabel;

  return (
    <>
      <span
        className={`${SHOW_DETAIL_VENDOR_AVATAR} ${vendorAvatarToneClass(row.wholesalerId)}`}
        aria-hidden
      >
        {vendorInitials(row.wholesaler)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-admin-ink">
          {row.wholesaler}
        </span>
        <span className="mt-0.5 block truncate text-xs text-admin-inkMuted">
          {methodSummary}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={`block text-sm font-semibold leading-snug ${workspaceMoneyTabular} ${workspaceMoneyClassForLiability(amountOwed)}`}
        >
          {formatCurrency(amountOwed)}
        </span>
        <span className="block text-[11px] text-admin-inkMuted">owed</span>
      </span>
      {!isClosed ? (
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-admin-inkMuted transition-transform ${isEditing ? "rotate-90" : ""}`}
          aria-hidden
        />
      ) : null}
    </>
  );
}

export function ShowDetailObligationEntityRow({
  row,
  amountOwed,
  isClosed,
  isEditing,
  onOpenEdit,
}: {
  row: ShowDetailObligationRowModel;
  amountOwed: number;
  isClosed: boolean;
  isEditing: boolean;
  onOpenEdit: () => void;
}) {
  if (isClosed) {
    return (
      <div className={SHOW_DETAIL_OBLIGATION_ENTITY_ROW_STATIC}>
        <ObligationEntityRowContent
          row={row}
          amountOwed={amountOwed}
          isClosed={isClosed}
          isEditing={false}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={SHOW_DETAIL_OBLIGATION_ENTITY_ROW}
      aria-expanded={isEditing}
      aria-label={`Edit obligation for ${row.wholesaler}`}
      onClick={onOpenEdit}
    >
      <ObligationEntityRowContent
        row={row}
        amountOwed={amountOwed}
        isClosed={isClosed}
        isEditing={isEditing}
      />
    </button>
  );
}
