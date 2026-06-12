import { redirect } from "next/navigation";

export default async function AdminSpendingRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab === "expenses" || tab === "inventory") {
    redirect(`/admin/purchases?tab=${tab}`);
  }
  if (tab === "vendor-charges") {
    redirect("/admin/purchases?tab=inventory");
  }
  redirect("/admin/purchases");
}
