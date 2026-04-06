"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/app/_components/headers/WorkspaceHeader";
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
      />
      <div className={workspaceShellColumn}>
        <WorkspaceHeader
          title={title}
          email={email}
          roles={roles}
          envLabel={envLabel}
          isProduction={isProduction}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          <AdminWorkspaceProvider email={email}>
            {children}
          </AdminWorkspaceProvider>
        </main>
      </div>
    </div>
  );
}
