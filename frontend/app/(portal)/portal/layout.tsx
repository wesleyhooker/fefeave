import Link from "next/link";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
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
