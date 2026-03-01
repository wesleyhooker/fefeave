export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/portal" className="text-sm font-medium text-gray-900">
            Portal
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Back to home
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
