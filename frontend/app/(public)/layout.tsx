import { getSession } from "@/lib/auth/session.node";
import { PublicHeader } from "../_components/headers/PublicHeader";
import { PublicFooter } from "./_components/PublicFooter";
import { publicSiteClass } from "./_components/shell/publicShell";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const roles = session?.roles ?? [];
  const isStaff = roles.includes("ADMIN") || roles.includes("OPERATOR");
  const isLoggedIn = !!session;
  const email = session?.user?.email ?? null;

  return (
    <div className={`${publicSiteClass} flex min-h-dvh flex-col bg-fefe-cream`}>
      <PublicHeader isLoggedIn={isLoggedIn} isStaff={isStaff} email={email} />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
