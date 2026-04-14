import { BanknotesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionCompleteMd,
  workspaceActionIconMd,
} from "@/app/(admin)/admin/_components/workspaceUi";
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
        <Link href="/admin/payments/new" className={workspaceActionCompleteMd}>
          <WorkspaceActionLabel
            icon={<BanknotesIcon className={workspaceActionIconMd} />}
          >
            Record payment
          </WorkspaceActionLabel>
        </Link>
      </div>
      <ShowDetailView id={id} />
    </div>
  );
}
