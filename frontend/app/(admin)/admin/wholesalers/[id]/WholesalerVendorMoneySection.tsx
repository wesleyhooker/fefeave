"use client";

import type { PaymentDTO } from "@/src/lib/api/payments";
import { WorkspaceSegmentedControl } from "@/app/(admin)/admin/_components/WorkspaceSegmentedControl";
import {
  workspaceCard,
  workspaceSectionTitle,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WholesalerInlineExpenseSection,
  type VendorExpenseEditDraft,
} from "./WholesalerInlineExpenseSection";
import { WholesalerInlinePaySection } from "./WholesalerInlinePaySection";

export type VendorMoneyTab = "payment" | "expense";

const MONEY_TAB_OPTIONS = [
  { value: "payment" as const, label: "Payment" },
  { value: "expense" as const, label: "Expense" },
];

/**
 * Vendor transactions workspace: Payment / Expense switch + one inline form.
 * Forms render embedded (no nested card) so this reads as one surface.
 */
export function WholesalerVendorMoneySection({
  wholesalerId,
  currentBalance,
  activeTab,
  onTabChange,
  paymentEdit,
  expenseEdit,
  onCancelPaymentEdit,
  onCancelExpenseEdit,
  onRecorded,
}: {
  wholesalerId: string;
  currentBalance: number;
  activeTab: VendorMoneyTab;
  onTabChange: (tab: VendorMoneyTab) => void;
  paymentEdit: PaymentDTO | null;
  expenseEdit: VendorExpenseEditDraft | null;
  onCancelPaymentEdit: () => void;
  onCancelExpenseEdit: () => void;
  onRecorded: () => void;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden ring-1 ring-gray-200/55 ${workspaceCard}`}
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
        <div className="border-b border-gray-200/60 px-4 py-2.5 sm:px-5 sm:py-2.5">
          <WorkspaceSegmentedControl
            ariaLabel="Payment or vendor expense"
            value={activeTab}
            onChange={onTabChange}
            options={MONEY_TAB_OPTIONS}
          />
        </div>

        <div className="min-w-0">
          {activeTab === "payment" ? (
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
          ) : (
            <WholesalerInlineExpenseSection
              wholesalerId={wholesalerId}
              currentBalance={currentBalance}
              mode={expenseEdit ? "edit" : "create"}
              editExpense={expenseEdit}
              onCancelEdit={onCancelExpenseEdit}
              onRecorded={onRecorded}
              density="compact"
              embedded
            />
          )}
        </div>
      </div>
    </section>
  );
}
