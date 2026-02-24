export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">
        Welcome to Fefe Ave
      </h1>
      <p className="text-gray-600">
        Curated finds, amazing prices. Your treasure hunt starts here.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <a
          href="/admin"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Admin
        </a>
        <a
          href="/portal"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Portal
        </a>
      </div>
    </div>
  );
}
