import { getSession } from "@/lib/auth/session.node";
import { AdminLayoutClient } from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isProduction = process.env.NODE_ENV === "production";
  const envLabel = isProduction ? "prod" : "dev";

  return (
    <AdminLayoutClient
      title="Workspace"
      email={session?.user?.email ?? null}
      roles={session?.roles ?? []}
      envLabel={envLabel}
      isProduction={isProduction}
    >
      {children}
    </AdminLayoutClient>
  );
}
