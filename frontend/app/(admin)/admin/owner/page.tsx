import { redirect } from "next/navigation";
import { BUSINESS_HEALTH_HREF } from "../_lib/adminSidebarNav";

export default function AdminOwnerLegacyRedirect() {
  redirect(BUSINESS_HEALTH_HREF);
}
