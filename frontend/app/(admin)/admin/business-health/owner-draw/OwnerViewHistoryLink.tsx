import Link from "next/link";
import { workspaceActionUtilitySm } from "@/app/(admin)/admin/_components/workspaceUi";

export function OwnerViewHistoryLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={workspaceActionUtilitySm}
      aria-label="View owner payout events in the ledger"
    >
      View history
    </Link>
  );
}
