"use client";

import { createContext, useContext } from "react";

type AdminWorkspaceContextValue = {
  email: string | null;
};

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue>({
  email: null,
});

export function AdminWorkspaceProvider({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  return (
    <AdminWorkspaceContext.Provider value={{ email }}>
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  return useContext(AdminWorkspaceContext);
}
