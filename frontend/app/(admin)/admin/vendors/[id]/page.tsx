import { WholesalerDetailView } from "../../wholesalers/[id]/WholesalerDetailView";

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WholesalerDetailView key={id} id={id} />;
}
