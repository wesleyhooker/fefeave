import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PurchasesPageSkeleton } from "../_components/AdminPageSkeletons";
import PurchasesPageContent from "./PurchasesPageContent";
import { purchasesLegacyTabRedirectHref } from "./purchasesTabs";

export default async function AdminPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const legacyHref = purchasesLegacyTabRedirectHref(params);
  if (legacyHref != null) {
    redirect(legacyHref);
  }

  return (
    <Suspense fallback={<PurchasesPageSkeleton />}>
      <PurchasesPageContent />
    </Suspense>
  );
}
