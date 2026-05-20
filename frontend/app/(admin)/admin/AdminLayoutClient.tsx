"use client";

import { useEffect, useState } from "react";
import { WorkspaceHeader } from "@/app/_components/headers/WorkspaceHeader";
import { WorkspaceHeaderSlotsProvider } from "@/app/_components/headers/WorkspaceHeaderSlots";
import { AdminSidebar } from "./AdminSidebar";
import {
  workspaceShellBg,
  workspaceShellColumn,
} from "./_components/workspaceUi";
import { AdminWorkspaceProvider } from "./AdminWorkspaceContext";

export type AdminLayoutClientProps = {
  title: string;
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
  children: React.ReactNode;
};

export function AdminLayoutClient({
  title,
  email,
  roles,
  envLabel,
  isProduction,
  children,
}: AdminLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const sidebarEl = document.querySelector<HTMLElement>(
      "[data-debug-admin-sidebar]",
    );
    const sidebar =
      sidebarEl?.firstElementChild instanceof HTMLElement
        ? sidebarEl.firstElementChild
        : sidebarEl;
    const shellCol = document.querySelector<HTMLElement>(
      "[data-debug-admin-shell-col]",
    );
    const header = document.querySelector<HTMLElement>(
      "[data-debug-admin-header]",
    );
    const intro = document.querySelector<HTMLElement>(
      "[data-debug-page-intro]",
    );
    const thisWeek = document.querySelector<HTMLElement>(
      "[data-debug-this-week]",
    );
    const owedTile = document.querySelector<HTMLElement>(
      "[data-debug-kpi-owed]",
    );
    const cs = (el: HTMLElement | null) => (el ? getComputedStyle(el) : null);
    const sidebarBg = cs(sidebar)?.backgroundColor ?? null;
    const headerBg = cs(header)?.backgroundColor ?? null;
    const introBg = cs(intro)?.backgroundColor ?? null;
    const thisWeekBorderLeft = cs(thisWeek)?.borderLeftWidth ?? null;
    const shellBorderLeft = cs(shellCol)?.borderLeftWidth ?? null;
    const owedBg = cs(owedTile)?.backgroundColor ?? null;
    // #region agent log
    fetch("http://127.0.0.1:7468/ingest/1522ccb1-6424-4c5e-927e-e832d5b82e04", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "bfec8a",
      },
      body: JSON.stringify({
        sessionId: "bfec8a",
        runId: "post-fix-v8",
        hypothesisId: "A-E",
        location: "AdminLayoutClient.tsx:useEffect",
        message: "polish pass verification",
        data: {
          adminCanvas: root.getPropertyValue("--admin-canvas").trim(),
          adminHeaderSurface: root
            .getPropertyValue("--admin-header-surface")
            .trim(),
          sidebarBg,
          headerBg,
          introBg,
          shellBorderLeft,
          thisWeekBorderLeft,
          owedBg,
          colorsMatch:
            sidebarBg != null && headerBg != null && sidebarBg === headerBg,
          sidebarIsClay:
            sidebarBg != null &&
            /\(14[0-9],\s*6[0-9],\s*4[0-9]\)/.test(sidebarBg),
          thisWeekLinkHref:
            document
              .querySelector<HTMLAnchorElement>(
                "[data-debug-this-week] a[href]",
              )
              ?.getAttribute("href") ?? null,
          introWavePresent:
            document.querySelector(
              '[data-debug-page-intro] img[src*="page-intro-wave"]',
            ) != null,
          introAccentBorder:
            cs(intro?.querySelector("h1")?.parentElement ?? intro)
              ?.borderLeftWidth ?? null,
          kpiIconBoxShadow:
            cs(
              document.querySelector<HTMLElement>(
                '[data-debug-kpi-owed] [class*="rounded-full"]',
              ),
            )?.boxShadow ?? null,
          headerBorderBottom: cs(header)?.borderBottomWidth ?? null,
          headerInsetLeft:
            document
              .querySelector<HTMLElement>("[data-debug-header-inset]")
              ?.getBoundingClientRect().left ?? null,
          headerInsetMaxWidth:
            cs(document.querySelector<HTMLElement>("[data-debug-header-inset]"))
              ?.maxWidth ?? null,
          introTitleLeft:
            document
              .querySelector<HTMLElement>("[data-debug-page-intro] h1")
              ?.getBoundingClientRect().left ?? null,
          kpiGridLeft:
            document
              .querySelector<HTMLElement>("[data-debug-kpi-owed]")
              ?.closest('[aria-label="Summary"]')
              ?.getBoundingClientRect().left ?? null,
          pathname: window.location.pathname,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <div className={`flex min-h-screen ${workspaceShellBg}`}>
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        email={email}
        roles={roles}
        envLabel={envLabel}
        isProduction={isProduction}
      />
      <div className={workspaceShellColumn} data-debug-admin-shell-col>
        <WorkspaceHeaderSlotsProvider>
          <WorkspaceHeader
            title={title}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          <main className={`flex min-h-0 flex-1 flex-col ${workspaceShellBg}`}>
            <AdminWorkspaceProvider email={email}>
              {children}
            </AdminWorkspaceProvider>
          </main>
        </WorkspaceHeaderSlotsProvider>
      </div>
    </div>
  );
}
