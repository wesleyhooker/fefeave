import { getWholesalerIds } from "@/lib/ledgerMock";
import { WholesalerDetailView } from "./WholesalerDetailView";

export function generateStaticParams() {
  return getWholesalerIds().map((id) => ({ id }));
}

export default async function AdminWholesalerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WholesalerDetailView id={id} />;
}
