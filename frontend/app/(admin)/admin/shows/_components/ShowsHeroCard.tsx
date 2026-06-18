"use client";

import Image from "next/image";
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/format";
import { formatWeekRangeCompact } from "@/lib/weekRange";
import { WorkspaceSidePanelTrigger } from "@/app/(admin)/admin/_components/WorkspaceSidePanelTrigger";
import {
  WORKFLOW_CURRENT_PERIOD_HEADING,
  WORKFLOW_SHOWS_HERO_HEADING,
  WORKFLOW_SHOWS_HERO_LOG_LABEL,
  WORKFLOW_SHOWS_INDEX_OWED_LABEL,
  WORKFLOW_SHOWS_INDEX_SHOWS_COUNT_LABEL,
  WORKFLOW_SHOWS_PROFIT_LABEL,
} from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { workspaceActionIconMd } from "@/app/(admin)/admin/_components/workspaceUi";
import type { ShowsCurrentPeriodBounds } from "../_lib/showsPeriodModel";
import type { CurrentPeriodShowStats } from "../_lib/computeCurrentPeriodShowStats";
import {
  SHOWS_HERO_CARD_ART_CELL,
  SHOWS_HERO_CARD_ART_IMAGE,
  SHOWS_HERO_CARD_BANNER,
  SHOWS_HERO_CARD_COPY,
  SHOWS_HERO_CARD_DATE,
  SHOWS_HERO_CARD_EYEBROW,
  SHOWS_HERO_CARD_HEADING,
  SHOWS_HERO_CARD_SHELL,
  SHOWS_HERO_CARD_STATS,
  SHOWS_HERO_CARD_STATS_CELL,
  SHOWS_HERO_CARD_STATS_GRID,
} from "../_lib/showsHeroCardLayout";
import {
  SHOWS_HERO_ILLUSTRATION_INDEX_SIZES,
  SHOWS_HERO_ILLUSTRATION_INTRINSIC,
  SHOWS_INDEX_HERO_ILLUSTRATION_SRC,
} from "../_lib/showsHeroIllustration";
import { ShowsHeroStatCell, workspaceMoneyMuted } from "./ShowsHeroStatCell";

const HERO_HEADING_LINE_1 = "Let's log";
const HERO_HEADING_LINE_2 = "another great show.";

export function ShowsHeroCard({
  periodBounds,
  stats,
  isCreateOpen,
  onLogShow,
}: {
  periodBounds: ShowsCurrentPeriodBounds;
  stats: CurrentPeriodShowStats;
  isCreateOpen: boolean;
  onLogShow: () => void;
}) {
  const periodRangeLabel = formatWeekRangeCompact(periodBounds);
  const profitDisplay = stats.hasWeekProfit
    ? formatCurrency(stats.weekProfit)
    : "—";
  const owedDisplay = stats.hasOwed ? formatCurrency(stats.totalOwed) : "—";

  return (
    <section
      className={SHOWS_HERO_CARD_SHELL}
      aria-labelledby="shows-hero-heading"
    >
      <div className={SHOWS_HERO_CARD_BANNER}>
        <div className={SHOWS_HERO_CARD_COPY}>
          <p className={SHOWS_HERO_CARD_EYEBROW}>
            {WORKFLOW_CURRENT_PERIOD_HEADING}
          </p>
          <p className={SHOWS_HERO_CARD_DATE}>{periodRangeLabel}</p>
          <h2 id="shows-hero-heading" className={SHOWS_HERO_CARD_HEADING}>
            <span className="md:block">{HERO_HEADING_LINE_1}</span>
            <span className="hidden md:inline"> </span>
            <span className="md:block">{HERO_HEADING_LINE_2}</span>
            <span className="sr-only">{WORKFLOW_SHOWS_HERO_HEADING}</span>
          </h2>
          <div className="mt-5 sm:mt-6">
            <WorkspaceSidePanelTrigger
              variant="primary"
              open={isCreateOpen}
              label={WORKFLOW_SHOWS_HERO_LOG_LABEL}
              onClick={onLogShow}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className={SHOWS_HERO_CARD_ART_CELL} aria-hidden>
          <Image
            src={SHOWS_INDEX_HERO_ILLUSTRATION_SRC}
            alt=""
            width={SHOWS_HERO_ILLUSTRATION_INTRINSIC.width}
            height={SHOWS_HERO_ILLUSTRATION_INTRINSIC.height}
            priority
            sizes={SHOWS_HERO_ILLUSTRATION_INDEX_SIZES}
            className={SHOWS_HERO_CARD_ART_IMAGE}
          />
        </div>
      </div>

      <div className={SHOWS_HERO_CARD_STATS}>
        <div className={SHOWS_HERO_CARD_STATS_GRID}>
          <div className={SHOWS_HERO_CARD_STATS_CELL}>
            <ShowsHeroStatCell
              label={WORKFLOW_SHOWS_INDEX_SHOWS_COUNT_LABEL}
              valueTone="count"
              iconWell="attention"
              icon={<CalendarDaysIcon className={workspaceActionIconMd} />}
              lead
              value={stats.showCount}
            />
          </div>

          <div className={SHOWS_HERO_CARD_STATS_CELL}>
            <ShowsHeroStatCell
              label={WORKFLOW_SHOWS_PROFIT_LABEL}
              valueTone="profit"
              iconWell="success"
              icon={<CurrencyDollarIcon className={workspaceActionIconMd} />}
              numericValue={stats.hasWeekProfit ? stats.weekProfit : null}
              value={
                stats.hasWeekProfit ? (
                  profitDisplay
                ) : (
                  <span className={workspaceMoneyMuted}>—</span>
                )
              }
            />
          </div>

          <div className={SHOWS_HERO_CARD_STATS_CELL}>
            <ShowsHeroStatCell
              label={WORKFLOW_SHOWS_INDEX_OWED_LABEL}
              valueTone="liability"
              iconWell="liability"
              icon={<CurrencyDollarIcon className={workspaceActionIconMd} />}
              numericValue={stats.hasOwed ? stats.totalOwed : null}
              value={
                stats.hasOwed ? (
                  owedDisplay
                ) : (
                  <span className={workspaceMoneyMuted}>—</span>
                )
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
