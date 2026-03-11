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
      <nav className="mb-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/admin/shows" className="hover:text-gray-700">
          Shows
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page">Show</span>
      </nav>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/payments/new"
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Record payment
        </Link>
      </div>
      <ShowDetailView id={id} />
    </div>
  );
}
