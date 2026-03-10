import { getSession } from "@/lib/auth/session.node";
import { AdminHeaderUser } from "./AdminHeaderUser";
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
        <header className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">
              Admin area
            </span>
            <AdminHeaderUser
              email={session?.user?.email ?? null}
              roles={session?.roles ?? []}
              envLabel={envLabel}
              isProduction={isProduction}
            />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
