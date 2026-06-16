"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-lg font-semibold text-admin-ink">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-admin-inkMuted">
        Try refreshing the page. If this keeps happening in local dev, reset the
        frontend cache: <code className="text-xs">make dev-reset-frontend</code>{" "}
        (or <code className="text-xs">make dev-down</code> then{" "}
        <code className="text-xs">make dev</code>).
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-admin-border px-3 py-2 text-sm font-medium text-admin-ink hover:bg-admin-mutedStrip/60"
      >
        Try again
      </button>
    </div>
  );
}
