import { redirect } from "next/navigation";
import { Suspense } from "react";
import { VENDORS_HREF } from "../../_lib/adminSidebarNav";
import { BalancesPageSkeleton } from "../../_components/AdminPageSkeletons";
import AccountsSettingsPageContent from "./AccountsSettingsPageContent";

export default async function AdminSettingsAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  if (add === "1") {
    redirect(`${VENDORS_HREF}?add=1`);
  }

  return (
    <Suspense fallback={<BalancesPageSkeleton />}>
      <AccountsSettingsPageContent />
    </Suspense>
  );
}
