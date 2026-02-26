import { WholesalerDetailView } from "./WholesalerDetailView";

export default async function AdminWholesalerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WholesalerDetailView id={id} />;
}
