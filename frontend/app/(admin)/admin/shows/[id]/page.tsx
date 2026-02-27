import Link from "next/link";
import { ShowDetailView } from "./ShowDetailView";

export default async function AdminShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/shows"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Shows
        </Link>
        <Link
          href="/admin/payments/new"
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Record Payment
        </Link>
      </div>
      <ShowDetailView id={id} />
    </div>
  );
}
