import Link from "next/link";
import {
  WORKFLOW_LOG_SHOW_TRIGGER_LABEL,
  WORKFLOW_QUICK_ACTION_PAY_VENDOR,
  WORKFLOW_QUICK_ACTION_RECORD_EXPENSE,
  WORKFLOW_QUICK_ACTION_RECORD_INVENTORY,
  WORKFLOW_QUICK_ACTIONS_HEADING,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import {
  dashboardEyebrow,
  dashboardModulePanel,
  dashboardModulePanelHeader,
  dashboardPadX,
} from "./dashboardStructure";

const actionLinkClass =
  "flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-stone-200/90 bg-white px-2.5 py-2 text-center text-xs font-medium leading-snug text-stone-800 transition-colors hover:bg-rose-50/55 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/35 sm:text-sm";

export function DashboardQuickActions({
  onLogShowClick,
}: {
  onLogShowClick: () => void;
}) {
  return (
    <section
      className={dashboardModulePanel}
      aria-labelledby="dashboard-quick-actions-heading"
    >
      <div className={dashboardModulePanelHeader}>
        <h2 id="dashboard-quick-actions-heading" className={dashboardEyebrow}>
          {WORKFLOW_QUICK_ACTIONS_HEADING}
        </h2>
      </div>
      <ul
        className={`${dashboardPadX} m-0 grid list-none grid-cols-2 gap-2 py-3 sm:gap-2.5`}
      >
        <li>
          <button
            type="button"
            onClick={onLogShowClick}
            className={actionLinkClass}
          >
            {WORKFLOW_LOG_SHOW_TRIGGER_LABEL}
          </button>
        </li>
        <li>
          <Link
            href="/admin/purchases?tab=expenses"
            className={actionLinkClass}
          >
            {WORKFLOW_QUICK_ACTION_RECORD_EXPENSE}
          </Link>
        </li>
        <li>
          <Link href="/admin/purchases" className={actionLinkClass}>
            {WORKFLOW_QUICK_ACTION_RECORD_INVENTORY}
          </Link>
        </li>
        <li>
          <Link href="/admin/vendors" className={actionLinkClass}>
            {WORKFLOW_QUICK_ACTION_PAY_VENDOR}
          </Link>
        </li>
      </ul>
    </section>
  );
}
