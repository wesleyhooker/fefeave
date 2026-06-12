"use client";

import { WorkspaceNativeSelect } from "@/app/(admin)/admin/_components/WorkspaceNativeSelect";
import { workspaceFormLabel } from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKFLOW_PURCHASES_RECORD_TYPE_FIELD_LABEL } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { RecordExpenseForm } from "../expenses/ExpensesPageContent";
import { RecordInventoryPurchaseForm } from "../inventory/InventoryPageContent";
import type { InventoryPaymentStatus } from "@/src/lib/api/inventory-purchases";
import {
  RECORD_PURCHASE_TYPE_INVENTORY,
  RECORD_PURCHASE_TYPE_OPTIONS,
  type RecordPurchaseType,
} from "./recordPurchaseTypes";

export function RecordPurchasePanel({
  recordType,
  onRecordTypeChange,
  onSuccess,
  initialWholesalerId,
  initialPaymentStatus,
}: {
  recordType: RecordPurchaseType;
  onRecordTypeChange: (type: RecordPurchaseType) => void;
  onSuccess?: () => void;
  initialWholesalerId?: string;
  initialPaymentStatus?: InventoryPaymentStatus;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${workspaceFormLabel}`}>
          {WORKFLOW_PURCHASES_RECORD_TYPE_FIELD_LABEL}
        </span>
        <WorkspaceNativeSelect
          required
          value={recordType}
          onChange={(e) =>
            onRecordTypeChange(e.target.value as RecordPurchaseType)
          }
        >
          {RECORD_PURCHASE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </WorkspaceNativeSelect>
      </label>

      {recordType === RECORD_PURCHASE_TYPE_INVENTORY ? (
        <RecordInventoryPurchaseForm
          onSuccess={onSuccess}
          initialWholesalerId={initialWholesalerId}
          initialPaymentStatus={initialPaymentStatus}
        />
      ) : (
        <RecordExpenseForm onSuccess={onSuccess} />
      )}
    </div>
  );
}
