import { redirect } from "next/navigation";

/**
 * Wholesaler list is consolidated into Balances.
 * Redirect so bookmarks and old links land on the canonical workspace.
 */
export default function AdminWholesalersPage() {
  redirect("/admin/balances");
}
