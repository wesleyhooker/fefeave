"use client";

import { useState } from "react";
import { WorkspaceHeader } from "./_components/headers/WorkspaceHeader";
import { WorkspaceHeaderSlotsProvider } from "./_components/headers/WorkspaceHeaderSlots";
import {
  WorkspacePageHeaderProvider,
  useWorkspacePageHeaderActive,
} from "./_components/headers/WorkspacePageHeaderContext";
import { AdminSidebar } from "./AdminSidebar";
import {
  workspaceShellColumn,
  workspaceShellRow,
} from "./_components/workspaceUi";
import { AdminWorkspaceProvider } from "./AdminWorkspaceContext";
import { WorkspaceAttentionProvider } from "./_components/WorkspaceAttentionContext";
import { WorkspaceAttentionSync } from "./_components/WorkspaceAttentionSync";
import { WorkspaceNotificationsProvider } from "./_components/WorkspaceNotificationsContext";

export type AdminLayoutClientProps = {
  title: string;
  email: string | null;
  roles: string[];
  envLabel: string;
  isProduction: boolean;
  children: React.ReactNode;
};

function AdminShellColumn({
  title,
  email,
  roles,
  onMenuClick,
  children,
}: {
  title: string;
  email: string | null;
  roles: string[];
  onMenuClick: () => void;
  children: React.ReactNode;
}) {
  const pageHeaderActive = useWorkspacePageHeaderActive();

  return (
    <div className={workspaceShellColumn}>
      <WorkspaceHeaderSlotsProvider>
        <WorkspaceAttentionProvider>
          <WorkspaceNotificationsProvider>
            <WorkspaceAttentionSync />
            {!pageHeaderActive ? (
              <WorkspaceHeader
                title={title}
                email={email}
                roles={roles}
                onMenuClick={onMenuClick}
              />
            ) : null}
            <main className="flex min-h-0 flex-1 flex-col">
              <AdminWorkspaceProvider
                email={email}
                roles={roles}
                onOpenMobileSidebar={onMenuClick}
              >
                {children}
              </AdminWorkspaceProvider>
            </main>
          </WorkspaceNotificationsProvider>
        </WorkspaceAttentionProvider>
      </WorkspaceHeaderSlotsProvider>
    </div>
  );
}

export function AdminLayoutClient({
  title,
  email,
  roles,
  envLabel,
  isProduction,
  children,
}: AdminLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={workspaceShellRow}>
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        envLabel={envLabel}
        isProduction={isProduction}
      />
      <WorkspacePageHeaderProvider>
        <AdminShellColumn
          title={title}
          email={email}
          roles={roles}
          onMenuClick={() => setMobileSidebarOpen(true)}
        >
          {children}
        </AdminShellColumn>
      </WorkspacePageHeaderProvider>
    </div>
  );
}
