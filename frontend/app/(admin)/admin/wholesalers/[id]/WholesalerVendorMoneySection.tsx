"use client";

import type { PaymentDTO } from "@/src/lib/api/payments";
import {
  workspaceCard,
  workspaceSectionTitle,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WholesalerInlineExpenseSection,
  type VendorExpenseEditDraft,
} from "./WholesalerInlineExpenseSection";
import { VENDOR_DETAIL_PAYMENT_EXPENSE_DIVIDER } from "./_lib/vendorDetailPaymentLayout";
import { WholesalerInlinePaySection } from "./WholesalerInlinePaySection";

/**
 * Vendor transactions workspace: payment create/edit plus ledger-row charge edits.
 * Manual charge creation is not exposed here — use Purchases or show close-out.
 */
export function WholesalerVendorMoneySection({
  wholesalerId,
  currentBalance,
  paymentEdit,
  expenseEdit,
  onCancelPaymentEdit,
  onCancelExpenseEdit,
  onRecorded,
  /** When true, parent card provides title, shell, and edit-mode cancel. */
  embeddedInSectionCard = false,
}: {
  wholesalerId: string;
  currentBalance: number;
  paymentEdit: PaymentDTO | null;
  expenseEdit: VendorExpenseEditDraft | null;
  onCancelPaymentEdit: () => void;
  onCancelExpenseEdit: () => void;
  onRecorded: () => void;
  embeddedInSectionCard?: boolean;
}) {
  const inner = (
    <>
      <WholesalerInlinePaySection
        wholesalerId={wholesalerId}
        currentBalance={currentBalance}
        mode={paymentEdit ? "edit" : "create"}
        editPayment={paymentEdit}
        onCancelEdit={onCancelPaymentEdit}
        onRecorded={onRecorded}
        density="compact"
        embedded
        parentHandlesEditHeader={embeddedInSectionCard}
      />

      {expenseEdit ? (
        <div className={VENDOR_DETAIL_PAYMENT_EXPENSE_DIVIDER}>
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
    </>
  );

  if (embeddedInSectionCard) {
    return <div className="min-w-0">{inner}</div>;
  }

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
          {inner}
        </div>
      </div>
    </section>
  );
}
