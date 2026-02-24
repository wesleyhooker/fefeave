export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Admin
        </h2>
        <nav className="flex flex-col gap-1">
          <a
            href="/admin"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Overview
          </a>
          <a
            href="/admin/dashboard"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Dashboard
          </a>
          <a
            href="/admin/shows"
            className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Shows
          </a>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Admin area
            </span>
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to site
            </a>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
