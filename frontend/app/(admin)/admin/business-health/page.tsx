"use client";

import { Suspense } from "react";
import { BusinessHealthTopLevelSkeleton } from "../_components/AdminPageSkeletons";
import BusinessHealthPageContent from "./BusinessHealthPageContent";

export default function BusinessHealthPage() {
  return (
    <Suspense fallback={<BusinessHealthTopLevelSkeleton />}>
      <BusinessHealthPageContent />
    </Suspense>
  );
}
