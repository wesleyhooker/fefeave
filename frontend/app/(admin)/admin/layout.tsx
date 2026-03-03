import Link from "next/link";
import { getSession } from "@/lib/auth/session.node";
import { AdminHeaderUser } from "./AdminHeaderUser";

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
      <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Admin
        </h2>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Home
          </Link>
          <Link
            href="/admin/shows"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Shows
          </Link>
          <Link
            href="/admin/wholesalers"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Wholesalers
          </Link>
          <Link
            href="/admin/balances"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Balances
          </Link>
          <Link
            href="/admin/payments"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Payments
          </Link>
          <Link
            href="/admin/inventory"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Inventory
          </Link>
        </nav>
      </aside>
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
