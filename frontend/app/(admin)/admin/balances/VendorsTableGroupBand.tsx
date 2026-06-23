"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { WORKSPACE_LABEL_CAPTION } from "@/app/(admin)/admin/_lib/workspaceDesignTokens";
import { workspaceTableRowInteractive } from "@/app/(admin)/admin/_components/workspaceUi";
import {
  VENDORS_TABLE_GROUP_BAND_ACTION,
  VENDORS_TABLE_GROUP_BAND_ACTION_COUNT,
  VENDORS_TABLE_GROUP_BAND_ACTION_TITLE,
  VENDORS_TABLE_GROUP_BAND_QUIET,
  VENDORS_TABLE_GROUP_BAND_QUIET_COUNT,
  VENDORS_TABLE_GROUP_BAND_QUIET_TITLE,
  VENDORS_TABLE_GROUP_BAND_SEAM,
  VENDORS_TABLE_GROUP_BAND_SEPARATOR,
} from "./vendorsTableGroupLayout";

export type VendorsTableGroupBandVariant = "action" | "quiet";

type VendorsTableGroupBandProps = {
  variant: VendorsTableGroupBandVariant;
  title: string;
  count: number;
  subtitle: string;
  footnote?: string;
  showTopSeam?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  bandId?: string;
};

function bandShellClass(
  variant: VendorsTableGroupBandVariant,
  showTopSeam: boolean,
) {
  const base =
    variant === "action"
      ? VENDORS_TABLE_GROUP_BAND_ACTION
      : VENDORS_TABLE_GROUP_BAND_QUIET;
  return showTopSeam ? `${VENDORS_TABLE_GROUP_BAND_SEAM} ${base}` : base;
}

function BandContent({
  variant,
  title,
  count,
  subtitle,
  footnote,
  collapsible,
  expanded,
}: Pick<
  VendorsTableGroupBandProps,
  | "variant"
  | "title"
  | "count"
  | "subtitle"
  | "footnote"
  | "collapsible"
  | "expanded"
>) {
  const titleClass =
    variant === "action"
      ? VENDORS_TABLE_GROUP_BAND_ACTION_TITLE
      : VENDORS_TABLE_GROUP_BAND_QUIET_TITLE;
  const countClass =
    variant === "action"
      ? VENDORS_TABLE_GROUP_BAND_ACTION_COUNT
      : VENDORS_TABLE_GROUP_BAND_QUIET_COUNT;

  return (
    <div className="min-w-0 flex-1 text-left">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={titleClass}>{title}</span>
        <span className={VENDORS_TABLE_GROUP_BAND_SEPARATOR} aria-hidden>
          ·
        </span>
        <span className={countClass}>{count}</span>
      </div>
      <p className={`mt-1 ${WORKSPACE_LABEL_CAPTION}`}>{subtitle}</p>
      {footnote ? (
        <p className="mt-1.5 text-xs font-medium leading-snug text-admin-inkMuted">
          {footnote}
        </p>
      ) : null}
      {collapsible ? (
        <span className="sr-only">
          {expanded ? "Collapse section" : "Expand section"}
        </span>
      ) : null}
    </div>
  );
}

/** Desktop — full-width band row inside balances table. */
export function VendorsTableGroupBandRow({
  variant,
  title,
  count,
  subtitle,
  footnote,
  showTopSeam = false,
  collapsible = false,
  expanded = true,
  onToggle,
  bandId,
}: VendorsTableGroupBandProps) {
  const shell = bandShellClass(variant, showTopSeam);

  if (collapsible && onToggle) {
    return (
      <tr>
        <th scope="rowgroup" colSpan={7} className="p-0 font-normal">
          <button
            type="button"
            id={bandId}
            onClick={onToggle}
            aria-expanded={expanded}
            className={`flex w-full items-center gap-3 text-left ${shell} ${workspaceTableRowInteractive} touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-actionPrimary/40`}
          >
            <BandContent
              variant={variant}
              title={title}
              count={count}
              subtitle={subtitle}
              footnote={footnote}
              collapsible
              expanded={expanded}
            />
            <ChevronDownIcon
              className={`h-5 w-5 shrink-0 text-admin-inkMuted transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                expanded ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        </th>
      </tr>
    );
  }

  return (
    <tr id={bandId}>
      <th scope="rowgroup" colSpan={7} className={`font-normal ${shell}`}>
        <BandContent
          variant={variant}
          title={title}
          count={count}
          subtitle={subtitle}
          footnote={footnote}
        />
      </th>
    </tr>
  );
}

/** Mobile — section label above card stack inside table shell. */
export function VendorsTableGroupBandSection({
  variant,
  title,
  count,
  subtitle,
  footnote,
  showTopSeam = false,
  collapsible = false,
  expanded = true,
  onToggle,
  bandId,
}: VendorsTableGroupBandProps) {
  const shell = bandShellClass(variant, showTopSeam);

  if (collapsible && onToggle) {
    return (
      <button
        type="button"
        id={bandId}
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-3 text-left ${shell} ${workspaceTableRowInteractive} touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-admin-actionPrimary/40`}
      >
        <BandContent
          variant={variant}
          title={title}
          count={count}
          subtitle={subtitle}
          footnote={footnote}
          collapsible
          expanded={expanded}
        />
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-admin-inkMuted transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <div id={bandId} className={shell}>
      <BandContent
        variant={variant}
        title={title}
        count={count}
        subtitle={subtitle}
        footnote={footnote}
      />
    </div>
  );
}
