import { redirect } from "next/navigation";
import { vendorDetailHref } from "../../_lib/vendorRoutes";

export default async function AdminWholesalerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(vendorDetailHref(id));
}
