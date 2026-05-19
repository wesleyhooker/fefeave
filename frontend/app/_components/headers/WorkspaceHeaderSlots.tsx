"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceHeaderSlotsContextValue = {
  /** Optional replacement for the default centered search shell (usually null). */
  centerSlot: ReactNode | null;
  /** Page-level primary actions rendered ahead of the profile menu. */
  actionsSlot: ReactNode | null;
  setCenterSlot: (node: ReactNode | null) => void;
  setActionsSlot: (node: ReactNode | null) => void;
};

const WorkspaceHeaderSlotsContext =
  createContext<WorkspaceHeaderSlotsContextValue | null>(null);

export function WorkspaceHeaderSlotsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [centerSlot, setCenterState] = useState<ReactNode | null>(null);
  const [actionsSlot, setActionsState] = useState<ReactNode | null>(null);

  const setCenterSlot = useCallback((node: ReactNode | null) => {
    setCenterState(node);
  }, []);

  const setActionsSlot = useCallback((node: ReactNode | null) => {
    setActionsState(node);
  }, []);

  const value = useMemo(
    (): WorkspaceHeaderSlotsContextValue => ({
      centerSlot,
      actionsSlot,
      setCenterSlot,
      setActionsSlot,
    }),
    [centerSlot, actionsSlot, setCenterSlot, setActionsSlot],
  );

  return (
    <WorkspaceHeaderSlotsContext.Provider value={value}>
      {children}
    </WorkspaceHeaderSlotsContext.Provider>
  );
}

export function useWorkspaceHeaderSlots(): WorkspaceHeaderSlotsContextValue {
  const ctx = useContext(WorkspaceHeaderSlotsContext);
  if (ctx == null) {
    throw new Error(
      "useWorkspaceHeaderSlots must be used within WorkspaceHeaderSlotsProvider",
    );
  }
  return ctx;
}
