import { ShowDetailView } from "./ShowDetailView";

export default async function AdminShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ShowDetailView id={id} />;
}
