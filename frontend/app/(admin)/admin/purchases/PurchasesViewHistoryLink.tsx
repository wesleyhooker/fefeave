import Link from "next/link";
import { workspaceActionUtilitySm } from "@/app/(admin)/admin/_components/workspaceUi";

export function PurchasesViewHistoryLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={workspaceActionUtilitySm}
      aria-label="View full purchase and expense history in the ledger"
    >
      View history
    </Link>
  );
}
