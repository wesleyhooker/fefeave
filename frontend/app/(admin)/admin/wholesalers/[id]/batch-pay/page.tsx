import { redirect } from "next/navigation";
import { vendorDetailBalanceByShowHref } from "@/app/(admin)/admin/_lib/vendorRoutes";

/** Legacy wholesaler batch-pay URL — redirects to vendor detail balance-by-show. */
export default async function AdminWholesalerBatchPayRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(vendorDetailBalanceByShowHref(id));
}
