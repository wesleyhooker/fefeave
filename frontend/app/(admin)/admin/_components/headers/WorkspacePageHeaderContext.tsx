"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WorkspacePageHeaderContextValue = {
  pageHeaderActive: boolean;
  registerPageHeader: (active: boolean) => void;
};

const WorkspacePageHeaderContext =
  createContext<WorkspacePageHeaderContextValue | null>(null);

export function WorkspacePageHeaderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeCount, setActiveCount] = useState(0);

  const registerPageHeader = useCallback((active: boolean) => {
    setActiveCount((count) => Math.max(0, active ? count + 1 : count - 1));
  }, []);

  const value = useMemo(
    (): WorkspacePageHeaderContextValue => ({
      pageHeaderActive: activeCount > 0,
      registerPageHeader,
    }),
    [activeCount, registerPageHeader],
  );

  return (
    <WorkspacePageHeaderContext.Provider value={value}>
      {children}
    </WorkspacePageHeaderContext.Provider>
  );
}

function useWorkspacePageHeaderContext(): WorkspacePageHeaderContextValue {
  const ctx = useContext(WorkspacePageHeaderContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspacePageHeaderContext must be used within WorkspacePageHeaderProvider",
    );
  }
  return ctx;
}

/** Opt pages into page-level header chrome (hides legacy global workspace bar). */
export function useRegisterWorkspacePageHeader(active: boolean): void {
  const { registerPageHeader } = useWorkspacePageHeaderContext();

  useEffect(() => {
    if (!active) return;
    registerPageHeader(true);
    return () => registerPageHeader(false);
  }, [active, registerPageHeader]);
}

/** Wrapper for loading shells that should match a page-aware header layout. */
/** @deprecated Prefer {@link AdminWorkspacePageLayout} `pageHeader` or {@link TopLevelPageSkeletonShell}. */
export function WorkspacePageHeaderMode({ children }: { children: ReactNode }) {
  useRegisterWorkspacePageHeader(true);
  return children;
}

export function useWorkspacePageHeaderActive(): boolean {
  return useWorkspacePageHeaderContext().pageHeaderActive;
}
