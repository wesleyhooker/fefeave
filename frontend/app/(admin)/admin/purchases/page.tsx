"use client";

import { Suspense } from "react";
import { BalancesPageSkeleton } from "../_components/AdminPageSkeletons";
import PurchasesPageContent from "./PurchasesPageContent";

export default function AdminPurchasesPage() {
  return (
    <Suspense fallback={<BalancesPageSkeleton />}>
      <PurchasesPageContent />
    </Suspense>
  );
}
