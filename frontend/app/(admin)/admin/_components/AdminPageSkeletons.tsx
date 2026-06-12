/**
 * Shared skeleton loading placeholders for admin pages.
 * Layout-matching, one cohesive skeleton per page. Uses animate-pulse and neutral gray.
 */
import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import {
  dashboardPadX,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyStatusCard,
} from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import {
  workspaceCard,
  workspaceCardHeader,
  workspaceSectionToolbar,
  workspaceShellBg,
  workspaceTheadSticky,
} from "./workspaceUi";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "./AdminPageContainer";

const bar = "h-4 rounded bg-gray-200 animate-pulse";

function SkeletonBar({ className = "w-24" }: { className?: string }) {
  return <span className={`inline-block ${bar} ${className}`} aria-hidden />;
}

/** Table with header labels and N rows of skeleton cells. */
export function TableSkeleton({
  cols,
  rows = 4,
  headers,
}: {
  cols: number;
  rows?: number;
  headers?: string[];
}) {
  return (
    <table className="min-w-full divide-y divide-gray-100">
      <thead className={workspaceShellBg}>
        <tr>
          {headers
            ? headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              ))
            : Array.from({ length: cols }, (_, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  <SkeletonBar className="w-16" />
                </th>
              ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            {Array.from({ length: cols }, (_, j) => (
              <td key={j} className="px-4 py-3">
                <SkeletonBar
                  className={
                    j === cols - 1 ? "w-20 ml-auto" : j === 0 ? "w-32" : "w-24"
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Dashboard: This Week hero — four metric columns + status band. */
export function DashboardSkeleton() {
  return (
    <>
      <AdminPageIntroSection containerTier="full">
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 border-l-2 border-rose-400/45 pl-3.5 sm:pl-4">
              <SkeletonBar className="h-8 w-52 max-w-full" />
              <SkeletonBar className="mt-2 h-4 w-64 max-w-full" />
            </div>
            <SkeletonBar className="h-10 w-full shrink-0 rounded-lg sm:w-36" />
          </div>
        </header>
      </AdminPageIntroSection>

      <AdminPageContainer containerTier="full">
        <WorkspaceGrid variant="stack">
          <WorkspaceGridItem span="full">
            <section className={dashboardWeeklyStatusCard} aria-hidden>
              <div className={dashboardWeeklyHeaderBand}>
                <SkeletonBar className="h-5 w-32 max-w-full" />
                <SkeletonBar className="mt-2 h-3 w-40 max-w-full" />
              </div>
              <div className={`${dashboardPadX} py-3 sm:py-4`}>
                <div className="grid grid-cols-2 gap-px rounded-xl border border-stone-200/90 bg-stone-200/80 p-px lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex min-h-[7.5rem] flex-col bg-white px-5 py-6 sm:px-6 ${i === 0 ? "sm:py-8" : "sm:py-7"}`}
                    >
                      <SkeletonBar className="h-2.5 w-16" />
                      <SkeletonBar
                        className={`${i === 0 ? "mt-3 h-10 w-32" : "mt-2.5 h-7 w-20"} max-w-full`}
                      />
                      <SkeletonBar className="mt-3 h-3 w-full max-w-[8rem]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-stone-100/90 px-4 py-3 sm:px-5">
                <SkeletonBar className="h-3 w-full max-w-md" />
              </div>
            </section>
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <div className="mt-1" aria-hidden>
              <SkeletonBar className="h-3 w-36" />
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-h-[15.5rem] rounded-2xl border border-stone-200/90 bg-white lg:col-span-6"
                  >
                    <div className="border-b border-stone-100/90 bg-stone-50/35 px-4 py-3">
                      <SkeletonBar className="h-9 w-28" />
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="flex justify-between gap-3">
                          <SkeletonBar className="h-3 w-24" />
                          <SkeletonBar className="h-3 w-28" />
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-stone-100/90 px-4 py-3">
                      <SkeletonBar className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <div
              className="mt-1 rounded-2xl border border-stone-200/90 bg-stone-50/55 px-4 py-4 sm:px-5"
              aria-hidden
            >
              <div className="grid grid-cols-1 gap-4 divide-y divide-stone-200/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 px-1 py-1 sm:px-3">
                    <SkeletonBar className="h-3 w-28" />
                    <SkeletonBar className="h-6 w-24" />
                    <SkeletonBar className="h-3 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </WorkspaceGridItem>
        </WorkspaceGrid>
      </AdminPageContainer>
    </>
  );
}

/** Balances page: title + subtitle intro, four summary tiles, toolbar + table. */
export function BalancesPageSkeleton() {
  return (
    <>
      <AdminPageIntroSection containerTier="full">
        <header>
          <div className="min-w-0">
            <SkeletonBar className="h-8 w-36 max-w-full" />
            <SkeletonBar className="mt-2 h-4 w-[min(100%,20rem)] max-w-full" />
          </div>
        </header>
      </AdminPageIntroSection>
      <AdminPageContainer containerTier="full">
        <WorkspaceGrid variant="stack" className="gap-6 md:gap-8">
          <WorkspaceGridItem span="full">
            <div className={`overflow-hidden ${workspaceCard}`}>
              <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:gap-0">
                <div className="min-w-0 md:flex-1 md:pr-8">
                  <SkeletonBar className="h-9 w-36 max-w-full sm:h-10 sm:w-44" />
                  <SkeletonBar className="mt-1.5 h-3 w-20" />
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-stone-200/80 pt-5 sm:gap-6 md:flex-1 md:border-l md:border-t-0 md:pt-0 md:pl-8">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="min-w-0">
                      <SkeletonBar className="h-5 w-16 max-w-full sm:h-6 sm:w-20" />
                      <SkeletonBar className="mt-1.5 h-3 w-full max-w-[5.5rem]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <div
              className={`overflow-hidden rounded-lg border border-admin-border/90 ${workspaceSectionToolbar}`}
            >
              <SkeletonBar className="h-10 w-full max-w-full rounded-lg sm:max-w-sm" />
            </div>
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <SkeletonBar className="h-10 w-full max-w-md rounded-lg" />
          </WorkspaceGridItem>
          <WorkspaceGridItem span="full">
            <div className={`overflow-hidden ${workspaceCard}`}>
              <div className="overflow-x-auto">
                <TableSkeleton
                  cols={7}
                  rows={6}
                  headers={[
                    "Status",
                    "Vendor",
                    "Balance owed",
                    "Total owed",
                    "Total paid",
                    "Last payment",
                    "",
                  ]}
                />
              </div>
            </div>
          </WorkspaceGridItem>
        </WorkspaceGrid>
      </AdminPageContainer>
    </>
  );
}

/** Payments page: intro + subtitle + primary action, table with chevron column. */
export function PaymentsTableSkeleton() {
  return (
    <>
      <AdminPageIntroSection>
        <header>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <SkeletonBar className="h-8 w-40 max-w-full" />
              <SkeletonBar className="mt-2 h-4 w-48 max-w-full" />
            </div>
            <SkeletonBar className="h-10 w-full shrink-0 rounded-lg sm:mt-1 sm:w-40" />
          </div>
        </header>
      </AdminPageIntroSection>
      <AdminPageContainer>
        <div className={`hidden overflow-hidden md:block ${workspaceCard}`}>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className={workspaceTheadSticky}>
              <tr>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
                >
                  Vendor
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
                >
                  Method
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
                >
                  Reference
                </th>
                <th scope="col" className="relative px-2 py-3 sm:px-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                    <SkeletonBar className="w-24" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                    <SkeletonBar className="w-28" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right sm:px-4">
                    <SkeletonBar className="ml-auto w-16" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                    <SkeletonBar className="w-14" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                    <SkeletonBar className="w-20" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                    <SkeletonBar className="ml-auto w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 pt-2 md:hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={`${workspaceCard} p-4`}>
              <SkeletonBar className="mb-2 w-24" />
              <SkeletonBar className="mb-2 w-32" />
              <SkeletonBar className="w-full" />
            </div>
          ))}
        </div>
      </AdminPageContainer>
    </>
  );
}

/** Shows page: intro + main column sections + xl operational rail. */
export function ShowsTableSkeleton() {
  return (
    <>
      <AdminPageIntroSection containerTier="full">
        <header>
          <SkeletonBar className="h-8 w-28 max-w-full" />
        </header>
      </AdminPageIntroSection>
      <AdminPageContainer containerTier="full">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-x-10 xl:gap-y-8">
          <div className="min-w-0 space-y-5 md:space-y-6 xl:col-span-9">
            <ShowsIndexThisWeekSkeleton />
            <ShowsIndexMainTableSkeleton rows={2} />
            <div className={`overflow-hidden ${workspaceCard}`}>
              <div className="border-b border-admin-border/80 px-4 py-4 sm:px-5">
                <SkeletonBar className="h-6 w-28" />
              </div>
              <div className="space-y-3 p-4">
                <SkeletonBar className="h-12 w-full rounded-lg" />
                <SkeletonBar className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <div className="hidden flex-col gap-4 xl:col-span-3 xl:flex xl:gap-5">
            <ShowsIndexRailSkeleton tall />
            <ShowsIndexRailSkeleton />
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}

function ShowsIndexRailSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`overflow-hidden ${workspaceCard}`}>
      <div className={workspaceCardHeader}>
        <SkeletonBar className="w-32" />
        <SkeletonBar className="mt-2 w-full" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-3/4" />
        {tall ? (
          <>
            <SkeletonBar className="mt-2 h-8 w-24" />
            <SkeletonBar className="h-10 w-full rounded-lg" />
            <SkeletonBar className="h-4 w-2/3" />
          </>
        ) : (
          <SkeletonBar className="h-10 w-full rounded-lg" />
        )}
      </div>
    </div>
  );
}

function ShowsIndexMainTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-admin-border/90 bg-admin-surfaceElevated shadow-workspace-surface-warm-sm">
      <div className="border-b border-admin-border/90 bg-admin-mutedStrip/55 px-4 py-3 sm:px-5 sm:py-4">
        <SkeletonBar className="w-28" />
        <SkeletonBar className="mt-2 w-full max-w-md" />
      </div>
      <div className="overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={workspaceShellBg}>
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Show
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Profit
              </th>
              <th scope="col" className="px-2 py-3 sm:px-3">
                <span className="sr-only">Navigate</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5 sm:px-4">
                  <SkeletonBar className="h-4 w-12" />
                </td>
                <td className="px-3 py-2.5 sm:px-4">
                  <div className="min-w-0 space-y-1">
                    <SkeletonBar className="w-36 max-w-full" />
                    <SkeletonBar className="w-28" />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                  <SkeletonBar className="w-24" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right sm:px-4">
                  <SkeletonBar className="ml-auto w-20" />
                </td>
                <td className="px-2 py-2.5 text-right sm:px-3">
                  <SkeletonBar className="ml-auto h-4 w-4 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShowsIndexThisWeekSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200/60 border-l-[6px] border-l-emerald-500/50 bg-emerald-50/15 shadow-workspace-surface">
      <div className="border-b border-emerald-100/90 bg-emerald-50/35 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <SkeletonBar className="w-32" />
            <SkeletonBar className="mt-2 w-full max-w-md" />
          </div>
          <SkeletonBar className="h-10 w-32 shrink-0 rounded-lg" />
        </div>
      </div>
      <div className="overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className={workspaceShellBg}>
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Show
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4"
              >
                Profit
              </th>
              <th scope="col" className="px-2 py-3 sm:px-3">
                <span className="sr-only">Navigate</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5 sm:px-4">
                  <SkeletonBar className="h-4 w-12" />
                </td>
                <td className="px-3 py-2.5 sm:px-4">
                  <div className="min-w-0 space-y-1">
                    <SkeletonBar className="w-36 max-w-full" />
                    <SkeletonBar className="w-28" />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                  <SkeletonBar className="w-24" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right sm:px-4">
                  <SkeletonBar className="ml-auto w-20" />
                </td>
                <td className="px-2 py-2.5 text-right sm:px-3">
                  <SkeletonBar className="ml-auto h-4 w-4 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
