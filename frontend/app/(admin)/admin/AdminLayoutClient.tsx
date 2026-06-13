"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/app/(admin)/admin/_components/headers/WorkspaceHeader";
import { WorkspaceHeaderSlotsProvider } from "@/app/(admin)/admin/_components/headers/WorkspaceHeaderSlots";
import { AdminSidebar } from "./AdminSidebar";
import {
  workspaceShellBg,
  workspaceShellColumn,
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
    <div className={`flex min-h-screen ${workspaceShellBg}`}>
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        envLabel={envLabel}
        isProduction={isProduction}
      />
      <div className={workspaceShellColumn}>
        <WorkspaceHeaderSlotsProvider>
          <WorkspaceAttentionProvider>
            <WorkspaceNotificationsProvider>
              <WorkspaceAttentionSync />
              <WorkspaceHeader
                title={title}
                email={email}
                roles={roles}
                onMenuClick={() => setMobileSidebarOpen(true)}
              />
              <main
                className={`flex min-h-0 flex-1 flex-col ${workspaceShellBg}`}
              >
                <AdminWorkspaceProvider email={email}>
                  {children}
                </AdminWorkspaceProvider>
              </main>
            </WorkspaceNotificationsProvider>
          </WorkspaceAttentionProvider>
        </WorkspaceHeaderSlotsProvider>
      </div>
    </div>
  );
}
