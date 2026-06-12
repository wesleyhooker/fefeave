"use client";

import { Suspense } from "react";
import { BalancesPageSkeleton } from "../_components/AdminPageSkeletons";
import FinancialActivityPageContent from "../financials/activity/FinancialActivityPageContent";

export default function AdminLedgerPage() {
  return (
    <Suspense fallback={<BalancesPageSkeleton />}>
      <FinancialActivityPageContent />
    </Suspense>
  );
}
