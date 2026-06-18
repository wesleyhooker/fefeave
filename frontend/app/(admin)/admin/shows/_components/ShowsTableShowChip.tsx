"use client";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import type { ShowFinancialSummary } from "@/app/(admin)/admin/_lib/showFinancialSummary";
import { workspaceActionIconSm } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  getShowsIndexStatusPresentation,
  SHOWS_INDEX_STATUS_CHIP_BY_TONE,
  SHOWS_INDEX_STATUS_CHIP_SHELL,
  SHOWS_INDEX_STATUS_LABEL_BY_TONE,
} from "../_lib/showsIndexStatusDisplay";

const statusRowClass = "inline-flex min-w-0 items-center gap-2 sm:gap-2.5";

/** Status-colored calendar chip for the Shows index table Status column. */
export function ShowsTableShowChip({
  status,
  summary,
}: {
  status: string;
  summary: ShowFinancialSummary | undefined;
}) {
  const { tone } = getShowsIndexStatusPresentation(status, summary);

  return (
    <span
      className={`${SHOWS_INDEX_STATUS_CHIP_SHELL} ${SHOWS_INDEX_STATUS_CHIP_BY_TONE[tone]}`}
      aria-hidden
    >
      <CalendarDaysIcon className={workspaceActionIconSm} />
    </span>
  );
}

export function ShowsTableStatusLabel({
  status,
  summary,
}: {
  status: string;
  summary: ShowFinancialSummary | undefined;
}) {
  const { label, tone } = getShowsIndexStatusPresentation(status, summary);

  return (
    <span
      className={`truncate text-xs font-medium leading-none sm:text-[13px] ${SHOWS_INDEX_STATUS_LABEL_BY_TONE[tone]}`}
      title={label.length > 18 ? label : undefined}
    >
      {label}
    </span>
  );
}

/** Status column — icon chip + colored status label. */
export function ShowsTableStatusCell({
  status,
  summary,
}: {
  status: string;
  summary: ShowFinancialSummary | undefined;
}) {
  return (
    <span className={statusRowClass}>
      <ShowsTableShowChip status={status} summary={summary} />
      <ShowsTableStatusLabel status={status} summary={summary} />
    </span>
  );
}
