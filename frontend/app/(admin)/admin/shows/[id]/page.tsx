import Link from "next/link";
import { getShowDetail, getShowIds } from "@/lib/mockData";
import { ShowDetailView } from "./ShowDetailView";

export function generateStaticParams() {
  return getShowIds().map((id) => ({ id }));
}

export default async function AdminShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getShowDetail(id);

  if (!detail) {
    return (
      <div>
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
        <p className="mt-4 text-gray-600">Show not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
      </div>
      <ShowDetailView initialDetail={detail} />
    </div>
  );
}
