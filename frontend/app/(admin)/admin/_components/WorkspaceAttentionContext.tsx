"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WorkspaceAttentionContextValue = {
  count: number;
  setAttentionCount: (count: number) => void;
};

const WorkspaceAttentionContext = createContext<WorkspaceAttentionContextValue>(
  {
    count: 0,
    setAttentionCount: () => {},
  },
);

/**
 * Header bell badge count. Populated by {@link WorkspaceAttentionSync} in the admin shell.
 */
export function WorkspaceAttentionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);
  const setAttentionCount = useCallback((next: number) => {
    setCount(Math.max(0, Math.min(99, next)));
  }, []);

  const value = useMemo(
    () => ({ count, setAttentionCount }),
    [count, setAttentionCount],
  );

  return (
    <WorkspaceAttentionContext.Provider value={value}>
      {children}
    </WorkspaceAttentionContext.Provider>
  );
}

export function useWorkspaceAttention(): WorkspaceAttentionContextValue {
  return useContext(WorkspaceAttentionContext);
}
