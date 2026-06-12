"use client";

import { Suspense } from "react";
import { BalancesPageSkeleton } from "../_components/AdminPageSkeletons";
import BusinessHealthPageContent from "./BusinessHealthPageContent";

export default function BusinessHealthPage() {
  return (
    <Suspense fallback={<BalancesPageSkeleton />}>
      <BusinessHealthPageContent />
    </Suspense>
  );
}
