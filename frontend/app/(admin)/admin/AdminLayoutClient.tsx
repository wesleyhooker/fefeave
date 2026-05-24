"use client";

import { useState } from "react";
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
      <div className={workspaceShellColumn}>
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
