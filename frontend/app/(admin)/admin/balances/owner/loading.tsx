export default function OwnerActivityLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 max-w-full rounded border border-stone-100 bg-stone-100" />
        <div className="h-4 w-72 max-w-full rounded border border-stone-100 bg-stone-50" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200/90 bg-white/90 p-4 shadow-workspace-surface"
          >
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="mt-3 h-7 w-28 rounded bg-stone-100" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-workspace-surface">
        <div className="hidden border-b border-stone-100 bg-stone-50/80 px-4 py-3 md:block">
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-stone-200" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-4 md:py-3">
              <div className="h-4 w-40 rounded bg-stone-100 md:hidden" />
              <div className="mt-2 h-4 w-24 rounded bg-stone-50 md:hidden" />
              <div className="hidden gap-4 md:flex">
                <div className="h-4 w-32 rounded bg-stone-100" />
                <div className="h-4 w-16 rounded bg-stone-100" />
                <div className="h-4 w-20 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
