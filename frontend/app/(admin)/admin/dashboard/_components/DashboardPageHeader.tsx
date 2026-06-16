"use client";

import { SparklesIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import type { WorkspacePageHeaderProps } from "@/app/(admin)/admin/_components/workspace/WorkspacePageHeader";

/** Dashboard page header config — week/date lives in {@link DashboardWeekHero}. */
export function useDashboardPageHeaderProps(): WorkspacePageHeaderProps {
  const { email } = useAdminWorkspace();

  const subtitle = useMemo(() => {
    const line = email?.trim();
    return line ? `Welcome back, ${line}.` : "Welcome back.";
  }, [email]);

  return useMemo(
    (): WorkspacePageHeaderProps => ({
      title: "Dashboard",
      titleDecoration: (
        <SparklesIcon
          className="h-[1.125em] w-[1.125em] shrink-0 text-admin-actionPrimary/85"
          aria-hidden
        />
      ),
      subtitle,
    }),
    [subtitle],
  );
}
