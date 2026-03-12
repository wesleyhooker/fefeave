import { getSession } from "@/lib/auth/session.node";
import { PublicHeader } from "../_components/headers/PublicHeader";

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
    <>
      <PublicHeader isLoggedIn={isLoggedIn} isStaff={isStaff} email={email} />
      <main>{children}</main>
    </>
  );
}
