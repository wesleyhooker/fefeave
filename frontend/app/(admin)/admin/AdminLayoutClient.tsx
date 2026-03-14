"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/app/_components/headers/WorkspaceHeader";
import { AdminSidebar } from "./AdminSidebar";

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
    <div className="flex min-h-screen">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          title={title}
          email={email}
          roles={roles}
          envLabel={envLabel}
          isProduction={isProduction}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
