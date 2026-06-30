"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { PaymentDTO } from "@/src/lib/api/payments";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HEADING,
  WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HINT,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  workspaceActionIconMd,
  workspaceActionSecondarySm,
} from "@/app/(admin)/admin/_components/workspaceUi";
import {
  VENDOR_DETAIL_PAYMENT_CARD,
  VENDOR_DETAIL_PAYMENT_CARD_BODY,
  VENDOR_DETAIL_PAYMENT_HEADER,
  VENDOR_DETAIL_PAYMENT_HEADER_ACTIONS,
  VENDOR_DETAIL_PAYMENT_HEADER_COPY,
  VENDOR_DETAIL_PAYMENT_HEADER_SUBTITLE,
  VENDOR_DETAIL_PAYMENT_HEADER_TITLE,
} from "../_lib/vendorDetailPaymentLayout";
import { WholesalerVendorMoneySection } from "../WholesalerVendorMoneySection";
import type { VendorExpenseEditDraft } from "../WholesalerInlineExpenseSection";

export function VendorDetailRecordPaymentCard({
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
  const isPaymentEdit = paymentEdit != null;

  return (
    <section
      id="vendor-payment"
      className={VENDOR_DETAIL_PAYMENT_CARD}
      aria-labelledby="vendor-record-payment-heading"
    >
      <div className={VENDOR_DETAIL_PAYMENT_CARD_BODY}>
        <div className={VENDOR_DETAIL_PAYMENT_HEADER}>
          <div className={VENDOR_DETAIL_PAYMENT_HEADER_COPY}>
            <h2
              id="vendor-record-payment-heading"
              className={VENDOR_DETAIL_PAYMENT_HEADER_TITLE}
            >
              {WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HEADING}
            </h2>
            <p className={VENDOR_DETAIL_PAYMENT_HEADER_SUBTITLE}>
              {WORKFLOW_VENDOR_DETAIL_RECORD_PAYMENT_HINT}
            </p>
          </div>
          {isPaymentEdit ? (
            <div className={VENDOR_DETAIL_PAYMENT_HEADER_ACTIONS}>
              <button
                type="button"
                className={workspaceActionSecondarySm}
                onClick={onCancelPaymentEdit}
              >
                <WorkspaceActionLabel
                  icon={<XMarkIcon className={workspaceActionIconMd} />}
                >
                  Cancel edit
                </WorkspaceActionLabel>
              </button>
            </div>
          ) : null}
        </div>

        <WholesalerVendorMoneySection
          wholesalerId={wholesalerId}
          currentBalance={currentBalance}
          paymentEdit={paymentEdit}
          expenseEdit={expenseEdit}
          onCancelPaymentEdit={onCancelPaymentEdit}
          onCancelExpenseEdit={onCancelExpenseEdit}
          onRecorded={onRecorded}
          embeddedInSectionCard
        />
      </div>
    </section>
  );
}
