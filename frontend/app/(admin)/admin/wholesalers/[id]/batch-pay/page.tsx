import { redirect } from "next/navigation";
import { vendorBatchPayHref } from "../../../_lib/vendorRoutes";

export default async function AdminWholesalerBatchPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(vendorBatchPayHref(id));
}
