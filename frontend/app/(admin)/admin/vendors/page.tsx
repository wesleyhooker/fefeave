import { Suspense } from "react";
import { BalancesPageSkeleton } from "../_components/AdminPageSkeletons";
import BalancesPageContent from "../balances/BalancesPageContent";

export default function AdminVendorsPage() {
  return (
    <Suspense fallback={<BalancesPageSkeleton />}>
      <BalancesPageContent />
    </Suspense>
  );
}
