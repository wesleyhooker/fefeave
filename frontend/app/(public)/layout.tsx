export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-lg font-semibold text-gray-900">
            Fefe Ave
          </a>
          <nav className="flex gap-4 text-sm text-gray-600">
            <a href="/" className="hover:text-gray-900">
              Home
            </a>
            <a href="/portal" className="hover:text-gray-900">
              Portal
            </a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
