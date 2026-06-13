"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AttentionItem } from "../_lib/workspaceAttentionItems";

type WorkspaceAttentionContextValue = {
  count: number;
  items: AttentionItem[];
  setAttentionState: (count: number, items: AttentionItem[]) => void;
};

const WorkspaceAttentionContext = createContext<WorkspaceAttentionContextValue>(
  {
    count: 0,
    items: [],
    setAttentionState: () => {},
  },
);

/**
 * Bell attention state (derived). Populated by {@link WorkspaceAttentionSync} in the admin shell.
 * Numeric badge uses unread notifications from {@link useWorkspaceNotifications}, not `count`.
 */
export function WorkspaceAttentionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AttentionItem[]>([]);

  const setAttentionState = useCallback(
    (nextCount: number, nextItems: AttentionItem[]) => {
      setCount(Math.max(0, Math.min(99, nextCount)));
      setItems(nextItems);
    },
    [],
  );

  const value = useMemo(
    () => ({ count, items, setAttentionState }),
    [count, items, setAttentionState],
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
