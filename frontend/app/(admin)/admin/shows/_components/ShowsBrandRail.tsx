"use client";

import { ArchiveBoxIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/format";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  WORKFLOW_SHOWS_ARCHIVE_HEADING,
  WORKFLOW_SHOWS_RAIL_UPCOMING_HEADING,
  WORKFLOW_SHOWS_RAIL_VIEW_ALL_UPCOMING,
  WORKFLOW_SHOWS_RAIL_VIEW_ARCHIVE,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { formatShowPlatformLabel } from "../_lib/showPlatformOptions";
import type { ShowViewModel } from "@/src/lib/api/shows";
import { SHOWS_INDEX_LAYOUT_RAIL } from "../showsIndexLayout";
import {
  SHOWS_INDEX_ARCHIVE_ILLUSTRATION_SRC,
  SHOWS_INDEX_UPCOMING_ILLUSTRATION_SRC,
} from "../_lib/showsIndexUi";
import { ShowsRailDecoratedCard } from "./ShowsRailDecoratedCard";
import { ShowsMotivationCard } from "./ShowsMotivationCard";

export function ShowsBrandRail({
  upcomingShow,
  closedPeriodCount,
  hasUpcomingPeriods,
}: {
  upcomingShow: ShowViewModel | null;
  closedPeriodCount: number;
  hasUpcomingPeriods: boolean;
}) {
  return (
    <aside aria-label="Shows highlights" className={SHOWS_INDEX_LAYOUT_RAIL}>
      <ShowsRailDecoratedCard
        title={WORKFLOW_SHOWS_RAIL_UPCOMING_HEADING}
        icon={<CalendarDaysIcon className={workspaceActionIconMd} />}
        iconWell="attention"
        artEmphasis
        illustrationSrc={SHOWS_INDEX_UPCOMING_ILLUSTRATION_SRC}
        summaryRows={
          upcomingShow != null
            ? [
                {
                  id: "upcoming-name",
                  label: upcomingShow.name,
                  value: formatDate(upcomingShow.date),
                },
                {
                  id: "upcoming-platform",
                  label: "Platform",
                  value: formatShowPlatformLabel(upcomingShow.platform) || "—",
                },
              ]
            : [
                {
                  id: "upcoming-empty",
                  label: "Next show",
                  value: "Nothing scheduled yet",
                  tone: "muted",
                },
              ]
        }
        footerAction={
          hasUpcomingPeriods
            ? {
                href: "#shows-upcoming-weeks-heading",
                label: WORKFLOW_SHOWS_RAIL_VIEW_ALL_UPCOMING,
              }
            : undefined
        }
        aria-label={WORKFLOW_SHOWS_RAIL_UPCOMING_HEADING}
      />

      <ShowsRailDecoratedCard
        title={WORKFLOW_SHOWS_ARCHIVE_HEADING}
        icon={<ArchiveBoxIcon className={workspaceActionIconMd} />}
        iconWell="milestone"
        illustrationSrc={SHOWS_INDEX_ARCHIVE_ILLUSTRATION_SRC}
        summaryRows={[
          {
            id: "archive-count",
            label: "Closed periods",
            value:
              closedPeriodCount === 1
                ? "1 closed period"
                : `${closedPeriodCount} closed periods`,
          },
        ]}
        footerAction={
          closedPeriodCount > 0
            ? {
                href: "#shows-past-weeks-heading",
                label: WORKFLOW_SHOWS_RAIL_VIEW_ARCHIVE,
                variant: "outline",
              }
            : undefined
        }
        aria-label={WORKFLOW_SHOWS_ARCHIVE_HEADING}
      />

      <ShowsMotivationCard />
    </aside>
  );
}
