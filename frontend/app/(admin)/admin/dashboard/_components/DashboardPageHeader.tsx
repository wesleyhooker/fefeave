"use client";

import { CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import {
  workspacePageIntroMetaDatePill,
  workspacePageIntroMetaDatePillCalendarIcon,
  workspacePageIntroMetaDatePillPeriod,
  workspacePageIntroMetaDatePillRange,
  workspacePageIntroMetaDatePillTextCol,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKFLOW_THIS_WEEK_HEADING } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";

export function DashboardPageHeader({
  weekRangeLabel,
  weekStartYmd,
}: {
  weekRangeLabel: string;
  /** Monday (local) for the operating week — for `<time dateTime>` on the week pill. */
  weekStartYmd: string;
}) {
  const { email } = useAdminWorkspace();

  const welcomeSubtitle = useMemo(() => {
    const line = email?.trim();
    return line ? `Welcome back, ${line}.` : "Welcome back.";
  }, [email]);

  const weekPill = useMemo(
    () => (
      <span className={workspacePageIntroMetaDatePill}>
        <CalendarDaysIcon
          className={workspacePageIntroMetaDatePillCalendarIcon}
          aria-hidden
        />
        <span className={workspacePageIntroMetaDatePillTextCol}>
          <span className={workspacePageIntroMetaDatePillPeriod}>
            {WORKFLOW_THIS_WEEK_HEADING}
          </span>
          <time
            className={workspacePageIntroMetaDatePillRange}
            dateTime={weekStartYmd}
          >
            {weekRangeLabel}
          </time>
        </span>
      </span>
    ),
    [weekRangeLabel, weekStartYmd],
  );

  return (
    <AdminPageIntro
      useAccent={false}
      decoration="none"
      title={
        <span className="inline-flex items-center gap-2">
          Dashboard
          <SparklesIcon
            className="h-[1.125em] w-[1.125em] shrink-0 text-admin-actionPrimary/85"
            aria-hidden
          />
        </span>
      }
      subtitle={welcomeSubtitle}
      action={weekPill}
    />
  );
}
