import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { ShowMobileCard } from "./ShowMobileCard";
import { WeekDesktopTable } from "./WeekDesktopTable";

export function ShowsUnscheduledSection({
  unscheduled,
  summaries,
}: {
  unscheduled: ShowViewModel[];
  summaries: Record<string, ShowFinancialSummary>;
}) {
  if (unscheduled.length === 0) return null;

  return (
    <section
      className="overflow-hidden rounded-lg border border-amber-200/60 border-l-4 border-l-amber-400/50 bg-amber-50/10 shadow-workspace-surface"
      aria-labelledby="shows-unscheduled-heading"
    >
      <div className="border-b border-amber-100/80 bg-amber-50/25 px-4 py-3">
        <h2
          id="shows-unscheduled-heading"
          className="text-sm font-semibold text-gray-900"
        >
          No show date
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
          These won&apos;t appear in weekly groups until a date is set. Edit the
          show to schedule it.
        </p>
      </div>
      <div className="md:hidden">
        <div className="space-y-3 p-3">
          {unscheduled.map((show) => (
            <ShowMobileCard
              key={show.id}
              show={show}
              summary={summaries[show.id]}
            />
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <WeekDesktopTable
          shows={unscheduled}
          summaries={summaries}
          showProfitHint={false}
        />
      </div>
    </section>
  );
}
