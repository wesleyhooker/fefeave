import { redirect } from "next/navigation";

export default function AdminExpensesPage() {
  redirect("/admin/purchases?tab=expenses");
}
