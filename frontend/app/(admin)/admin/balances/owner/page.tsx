import { redirect } from "next/navigation";
import { BUSINESS_HEALTH_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";

export default function AdminBalancesOwnerLegacyRedirect() {
  redirect(BUSINESS_HEALTH_HREF);
}
