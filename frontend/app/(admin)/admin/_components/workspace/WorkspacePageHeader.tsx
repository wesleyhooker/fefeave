"use client";

import type { ReactNode } from "react";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import {
  workspaceChromeHover,
  workspacePageHeaderLeading,
  workspacePageHeaderPadding,
  workspacePageHeaderSubtitle,
  workspacePageHeaderTitle,
  workspacePageHeaderTitleDecorationGap,
  workspacePageHeaderTitleRow,
  workspacePageHeaderTitleRowLeft,
  workspacePageHeaderUtilitiesCluster,
} from "../workspaceUi";
import { useRegisterWorkspacePageHeader } from "../headers/WorkspacePageHeaderContext";
import { WorkspaceHeaderUtilities } from "../headers/WorkspaceHeaderUtilities";

export type WorkspacePageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Icon or accent glyph beside the title (e.g. Dashboard sparkles). */
  titleDecoration?: ReactNode;
  /** Page-level primary actions — sits after utilities on desktop. */
  actions?: ReactNode;
  /**
   * Left slot before the title in the utilities row — back links, parent nav.
   * Shares the same horizontal band as the page title and workspace utilities.
   */
  leading?: ReactNode;
  /**
   * @deprecated Use {@link leading} — kept for migration; renders in the title row.
   */
  breadcrumb?: ReactNode;
  /** Compact row directly under the title (e.g. Shows primary action). */
  belowTitle?: ReactNode;
  /**
   * When true (default), registers page-aware header mode and renders workspace
   * utilities in the title row. Set false only for legacy intros during migration.
   */
  showUtilities?: boolean;
};

/**
 * Page-aware workspace header — one row: [leading + title] | utilities.
 * Sidebar owns brand identity; pages do not repeat “Fefe Ave • Workspace”.
 */
export function WorkspacePageHeader({
  title,
  subtitle,
  titleDecoration,
  actions,
  leading,
  breadcrumb,
  belowTitle,
  showUtilities = true,
}: WorkspacePageHeaderProps) {
  useRegisterWorkspacePageHeader(showUtilities);

  const { email, roles, openMobileSidebar } = useAdminWorkspace();
  const leadingContent = leading ?? breadcrumb;

  return (
    <header className={`relative ${workspacePageHeaderPadding}`}>
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className={workspacePageHeaderTitleRow}>
          <div className={workspacePageHeaderTitleRowLeft}>
            {openMobileSidebar ? (
              <button
                type="button"
                onClick={openMobileSidebar}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-admin-inkMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-actionPrimary/45 md:hidden ${workspaceChromeHover}`}
                aria-label="Open menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            ) : null}

            {leadingContent != null ? (
              <div className={workspacePageHeaderLeading}>{leadingContent}</div>
            ) : null}

            <h1 className={`min-w-0 ${workspacePageHeaderTitle}`}>
              {titleDecoration ? (
                <span
                  className={`inline-flex min-w-0 items-center ${workspacePageHeaderTitleDecorationGap}`}
                >
                  <span className="truncate">{title}</span>
                  {titleDecoration}
                </span>
              ) : (
                title
              )}
            </h1>
          </div>

          {showUtilities || actions ? (
            <div className={workspacePageHeaderUtilitiesCluster}>
              {showUtilities ? (
                <WorkspaceHeaderUtilities email={email} roles={roles} />
              ) : null}
              {actions ? (
                <div className="flex shrink-0 justify-end [&>*]:w-auto">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {belowTitle ? (
          <div className="flex flex-wrap items-center gap-2">{belowTitle}</div>
        ) : null}

        {subtitle ? (
          <p className={workspacePageHeaderSubtitle}>{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
