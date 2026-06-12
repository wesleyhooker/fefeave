import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL,
  WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

/** Temporary success copy on a Shows index row after close-out redirect. */
export function ShowCloseSuccessRowNote({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex gap-2.5 rounded-md border border-emerald-300/80 bg-white/75 px-2.5 py-2 shadow-sm ${className}`}
      role="status"
    >
      <CheckCircleIcon
        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-emerald-950">
          {WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_HEADLINE}
        </p>
        <p className="mt-0.5 text-xs font-medium leading-snug text-emerald-800">
          {WORKFLOW_SHOW_CLOSED_ROW_SUCCESS_DETAIL}
        </p>
      </div>
    </div>
  );
}
