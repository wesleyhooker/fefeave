/**
 * Shared skeleton loading placeholders for admin pages.
 * Layout-matching, one cohesive skeleton per page. Uses animate-pulse and neutral gray.
 */
import {
  workspacePagePrimarySecondaryGrid,
  workspacePageSupportingStack,
  workspacePageTopStack,
} from "@/app/(admin)/admin/_lib/workspacePageRegions";
import {
  dashboardAnalyticsBody,
  dashboardAnalyticsCard,
  dashboardAnalyticsHeader,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
  dashboardPrimaryListShell,
  dashboardRowList,
  dashboardRowPad,
  dashboardWeeklyHeaderBand,
  dashboardWeeklyHeroInsetWrapper,
  dashboardWeeklyShowsToolbar,
  dashboardWeeklyStatusCard,
} from "@/app/(admin)/admin/dashboard/_components/dashboardStructure";
import {
  workspaceCard,
  workspaceCardHeader,
  workspacePageContentWidthWide,
  workspacePageIntroAccent,
  workspaceSectionToolbar,
  workspaceShellBg,
  workspaceStatTile,
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

/** Dashboard: mirrors live `page.tsx` composition (header → stats → This week + Notifications → supporting analytics). */
export function DashboardSkeleton() {
  return (
    <>
      <AdminPageIntroSection>
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 border-l-2 border-rose-400/45 pl-3.5 sm:pl-4">
              <SkeletonBar className="h-8 w-52 max-w-full" />
              <SkeletonBar className="mt-2 h-4 w-64 max-w-full" />
            </div>
            <SkeletonBar className="h-10 w-full shrink-0 rounded-lg sm:w-28" />
          </div>
        </header>
      </AdminPageIntroSection>

      <AdminPageContainer>
        <div className={workspacePageTopStack}>
          <section aria-hidden>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex min-h-[7.75rem] flex-col rounded-xl border border-stone-200/80 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(120,113,108,0.06)] sm:min-h-[8rem] sm:px-5 sm:py-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <SkeletonBar className="h-2.5 w-24" />
                    <span className="h-9 w-9 shrink-0 rounded-full bg-stone-100" />
                  </div>
                  <SkeletonBar className="mt-4 h-7 w-28" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={workspacePagePrimarySecondaryGrid}>
          <div className="min-w-0">
            <section className={dashboardWeeklyStatusCard}>
              <div className={dashboardWeeklyHeaderBand}>
                <SkeletonBar className="h-5 w-32 max-w-full" />
              </div>
              <div
                className={`${dashboardWeeklyHeroInsetWrapper} rounded-xl bg-stone-50/55 p-1 sm:p-1.5`}
              >
                <div className="overflow-hidden rounded-[0.65rem] border border-stone-200/90 bg-white p-6 shadow-sm sm:p-7">
                  <SkeletonBar className="h-2.5 w-28" />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <SkeletonBar className="h-10 w-44 max-w-full sm:max-w-[75%]" />
                    <SkeletonBar className="h-10 w-full shrink-0 rounded-lg sm:w-36" />
                  </div>
                  <SkeletonBar className="mt-3 h-2.5 w-40 max-w-full" />
                </div>
              </div>
              <div className={dashboardWeeklyShowsToolbar}>
                <SkeletonBar className="h-2 w-16" />
              </div>
              <ul
                className={`${dashboardPrimaryListShell} ${dashboardRowList}`}
              >
                {[0, 1, 2].map((i) => (
                  <li key={i}>
                    <div
                      className={`flex min-w-0 items-center gap-3 ${dashboardRowPad}`}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-200" />
                        <SkeletonBar className="h-3 w-full max-w-[11rem]" />
                      </span>
                      <SkeletonBar className="h-2 w-12 shrink-0" />
                      <SkeletonBar className="h-3 w-16 shrink-0" />
                      <SkeletonBar className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="min-w-0">
            <aside className={dashboardModulePanel} aria-hidden>
              <div className={dashboardModulePanelHeader}>
                <SkeletonBar className="h-2 w-20" />
              </div>
              <ul className={dashboardRowList}>
                {[0, 1].map((i) => (
                  <li key={i}>
                    <div
                      className={`flex min-w-0 items-center gap-1.5 ${dashboardRowPad}`}
                    >
                      <SkeletonBar className="h-2 w-2 shrink-0 rounded-sm" />
                      <SkeletonBar className="h-2.5 w-full max-w-[9rem]" />
                      <SkeletonBar className="h-2.5 w-5 shrink-0" />
                      <SkeletonBar className="h-3.5 w-3.5 shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>

        <div className={workspacePageSupportingStack}>
          <section className={dashboardAnalyticsCard} aria-hidden>
            <div className={dashboardAnalyticsHeader}>
              <SkeletonBar className="h-3.5 w-28" />
              <SkeletonBar className="mt-1.5 h-3 w-40 max-w-full" />
            </div>
            <div className={dashboardAnalyticsBody}>
              <div className="h-12 w-full animate-pulse rounded-md bg-stone-200/60" />
              <div className="mt-2 flex justify-between">
                <SkeletonBar className="h-2 w-4" />
                <SkeletonBar className="h-2 w-4" />
              </div>
            </div>
          </section>
        </div>
      </AdminPageContainer>
    </>
  );
}

/** Balances page: title + subtitle intro, four summary tiles, toolbar + table. */
export function BalancesPageSkeleton() {
  return (
    <>
      <AdminPageIntroSection>
        <header>
          <div className={`min-w-0 ${workspacePageIntroAccent}`}>
            <SkeletonBar className="h-8 w-36 max-w-full" />
            <SkeletonBar className="mt-2 h-4 w-[min(100%,20rem)] max-w-full" />
          </div>
        </header>
      </AdminPageIntroSection>
      <AdminPageContainer>
        <div className={workspacePageTopStack}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={workspaceStatTile} aria-hidden>
                <SkeletonBar className="h-3 w-28" />
                <SkeletonBar className="mt-4 h-8 w-32 max-w-full" />
              </div>
            ))}
          </div>
          <div className={`overflow-hidden ${workspaceCard}`}>
            <div className={workspaceSectionToolbar}>
              <SkeletonBar className="h-10 w-full max-w-full rounded-lg sm:max-w-sm" />
              <SkeletonBar className="h-10 w-full rounded-lg sm:w-44" />
            </div>
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
        </div>
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
            <div className={`min-w-0 ${workspacePageIntroAccent}`}>
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

/** Shows page: full page chrome + week-grouped skeleton (matches loaded layout). */
export function ShowsTableSkeleton() {
  return (
    <>
      <AdminPageIntroSection
        contentWidthClassName={workspacePageContentWidthWide}
      >
        <header>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className={`min-w-0 ${workspacePageIntroAccent}`}>
              <SkeletonBar className="h-8 w-28 max-w-full" />
            </div>
            <SkeletonBar className="h-10 w-full shrink-0 rounded-lg sm:w-44" />
          </div>
        </header>
      </AdminPageIntroSection>
      <AdminPageContainer contentWidthClassName={workspacePageContentWidthWide}>
        <div className="mb-5 overflow-hidden rounded-xl border border-emerald-200/60 border-l-[6px] border-l-emerald-500/50 bg-emerald-50/15 shadow-workspace-surface">
          <div className="border-b border-emerald-100/90 bg-emerald-50/35 px-4 py-3 sm:px-5 sm:py-4">
            <SkeletonBar className="w-32" />
            <SkeletonBar className="mt-2 w-full max-w-md" />
            <SkeletonBar className="mt-2 w-56" />
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
                    Est. profit
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
      </AdminPageContainer>
    </>
  );
}
