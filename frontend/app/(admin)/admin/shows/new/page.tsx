import { redirect } from "next/navigation";

/** Log show uses the index drawer — keep this route as a bookmark-safe redirect. */
export default function AdminShowsNewPage() {
  redirect("/admin/shows?log=1");
}
