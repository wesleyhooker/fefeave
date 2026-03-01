import Link from "next/link";
import { getSession } from "@/lib/auth/session.node";

function formatRoles(roles?: string[]): string {
  if (!roles || roles.length === 0) return "none";
  return roles.join(", ");
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const envLabel = process.env.NODE_ENV === "production" ? "prod" : "dev";

  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/portal/statement"
            className="text-sm font-medium text-gray-900"
          >
            Portal
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/portal/statement"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Statement
            </Link>
            <a
              href="/api/portal/statement.csv"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Download CSV
            </a>
            <div className="hidden rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:block">
              {session?.user?.email ?? "unknown user"} | roles:{" "}
              {formatRoles(session?.roles)} | {envLabel}
            </div>
            <a
              href="/api/auth/logout"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </a>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
