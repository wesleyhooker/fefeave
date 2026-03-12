import { getSession } from "@/lib/auth/session.node";
import { WorkspaceHeader } from "@/app/_components/headers/WorkspaceHeader";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isProduction = process.env.NODE_ENV === "production";
  const envLabel = isProduction ? "prod" : "dev";

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <WorkspaceHeader
          title="Workspace"
          email={session?.user?.email ?? null}
          roles={session?.roles ?? []}
          envLabel={envLabel}
          isProduction={isProduction}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
