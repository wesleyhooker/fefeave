"use client";

import { createContext, useContext } from "react";

type AdminWorkspaceContextValue = {
  email: string | null;
  roles: string[];
  openMobileSidebar?: () => void;
};

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue>({
  email: null,
  roles: [],
  openMobileSidebar: undefined,
});

export function AdminWorkspaceProvider({
  email,
  roles = [],
  onOpenMobileSidebar,
  children,
}: {
  email: string | null;
  roles?: string[];
  onOpenMobileSidebar?: () => void;
  children: React.ReactNode;
}) {
  return (
    <AdminWorkspaceContext.Provider
      value={{ email, roles, openMobileSidebar: onOpenMobileSidebar }}
    >
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  return useContext(AdminWorkspaceContext);
}
