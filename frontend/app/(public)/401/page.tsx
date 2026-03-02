export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">401 - Unauthorized</h1>
      <p className="mt-3 text-gray-600">
        Your session is missing or expired. Please sign in to continue.
      </p>
      <a
        href="/login"
        className="mt-6 inline-flex rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Go to Login
      </a>
    </div>
  );
}
