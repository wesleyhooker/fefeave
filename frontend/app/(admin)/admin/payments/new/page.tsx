import { redirect } from "next/navigation";
import { VENDORS_HREF } from "../../_lib/adminSidebarNav";
import { vendorDetailPaymentHref } from "../../_lib/vendorRoutes";

export default async function AdminPaymentsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ wholesalerId?: string }>;
}) {
  const { wholesalerId } = await searchParams;
  if (wholesalerId?.trim()) {
    redirect(vendorDetailPaymentHref(wholesalerId.trim()));
  }

  redirect(VENDORS_HREF);
}
