import { redirect } from "next/navigation";
import { vendorDetailBalanceByShowHref } from "@/app/(admin)/admin/_lib/vendorRoutes";

/** Legacy batch-pay URL — redirects to embedded balance-by-show on vendor detail. */
export default async function AdminVendorBatchPayRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(vendorDetailBalanceByShowHref(id));
}
