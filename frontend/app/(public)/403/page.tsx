export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">403 - Forbidden</h1>
      <p className="mt-3 text-gray-600">
        You are signed in, but your account does not have access to this area.
      </p>
      <a
        href="/login"
        className="mt-6 inline-flex rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Switch Account
      </a>
    </div>
  );
}
