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
  redirect("/admin/purchases");
}
