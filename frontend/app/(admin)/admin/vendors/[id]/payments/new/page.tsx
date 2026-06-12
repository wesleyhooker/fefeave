import { redirect } from "next/navigation";
import { vendorDetailPaymentHref } from "@/app/(admin)/admin/_lib/vendorRoutes";

/** Vendor detail inline payment is the canonical create surface. */
export default async function AdminVendorRecordPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(vendorDetailPaymentHref(id));
}
