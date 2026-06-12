"use client";

import { useState } from "react";
import type { PaymentDTO } from "@/src/lib/api/payments";
import {
  WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_HELP,
  WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_TOGGLE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionSecondaryMd,
  workspaceActionTertiaryLink,
  workspaceCard,
  workspaceSectionTitle,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  WholesalerInlineExpenseSection,
  type VendorExpenseEditDraft,
} from "./WholesalerInlineExpenseSection";
import { WholesalerInlinePaySection } from "./WholesalerInlinePaySection";

/**
 * Vendor transactions workspace: payment create/edit plus ledger-row charge corrections.
 * Rare manual vendor obligations use the advanced create flow below.
 */
export function WholesalerVendorMoneySection({
  wholesalerId,
  currentBalance,
  paymentEdit,
  expenseEdit,
  onCancelPaymentEdit,
  onCancelExpenseEdit,
  onRecorded,
}: {
  wholesalerId: string;
  currentBalance: number;
  paymentEdit: PaymentDTO | null;
  expenseEdit: VendorExpenseEditDraft | null;
  onCancelPaymentEdit: () => void;
  onCancelExpenseEdit: () => void;
  onRecorded: () => void;
}) {
  const [advancedObligationOpen, setAdvancedObligationOpen] = useState(false);

  const showAdvancedToggle =
    !paymentEdit && !expenseEdit && !advancedObligationOpen;

  return (
    <section
      id="vendor-payment"
      className={`min-w-0 scroll-mt-24 overflow-hidden ring-1 ring-gray-200/55 ${workspaceCard}`}
      aria-labelledby="wholesaler-transactions-workspace-heading"
    >
      <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3 sm:px-5">
        <h2
          id="wholesaler-transactions-workspace-heading"
          className={workspaceSectionTitle}
        >
          Transactions
        </h2>
      </div>

      <div className="min-w-0 bg-gray-50/50">
        <div className="min-w-0 px-4 pb-7 pt-5 sm:px-5 sm:pb-8 sm:pt-7">
          <WholesalerInlinePaySection
            wholesalerId={wholesalerId}
            currentBalance={currentBalance}
            mode={paymentEdit ? "edit" : "create"}
            editPayment={paymentEdit}
            onCancelEdit={onCancelPaymentEdit}
            onRecorded={onRecorded}
            density="compact"
            embedded
          />

          {showAdvancedToggle ? (
            <div className="mt-5 border-t border-gray-200/60 pt-4">
              <p className="text-sm text-gray-600">
                {WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_HELP}
              </p>
              <button
                type="button"
                className={`${workspaceActionTertiaryLink} mt-2 text-sm font-medium`}
                onClick={() => setAdvancedObligationOpen(true)}
              >
                {WORKFLOW_VENDOR_DETAIL_ADVANCED_OBLIGATION_TOGGLE}
              </button>
            </div>
          ) : null}

          {advancedObligationOpen && !expenseEdit ? (
            <div className="mt-5 border-t border-gray-200/60 pt-4">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  className={`${workspaceActionSecondaryMd} shrink-0 text-sm`}
                  onClick={() => setAdvancedObligationOpen(false)}
                >
                  <WorkspaceActionLabel
                    icon={<XMarkIcon className={workspaceActionIconMd} />}
                  >
                    Cancel
                  </WorkspaceActionLabel>
                </button>
              </div>
              <WholesalerInlineExpenseSection
                wholesalerId={wholesalerId}
                currentBalance={currentBalance}
                mode="create"
                editExpense={null}
                onCancelEdit={() => setAdvancedObligationOpen(false)}
                onRecorded={() => {
                  setAdvancedObligationOpen(false);
                  onRecorded();
                }}
                density="compact"
                embedded
              />
            </div>
          ) : null}

          {expenseEdit ? (
            <div className="mt-5 border-t border-gray-200/60 pt-4">
              <WholesalerInlineExpenseSection
                wholesalerId={wholesalerId}
                currentBalance={currentBalance}
                mode="edit"
                editExpense={expenseEdit}
                onCancelEdit={onCancelExpenseEdit}
                onRecorded={onRecorded}
                density="compact"
                embedded
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
