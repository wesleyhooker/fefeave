"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAdminWorkspace } from "@/app/(admin)/admin/AdminWorkspaceContext";
import { WorkspaceActionLabel } from "@/app/(admin)/admin/_components/WorkspaceActionLabel";
import {
  workspaceActionIconMd,
  workspaceActionPrimaryMd,
} from "@/app/(admin)/admin/_components/workspaceUi";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";

function greetingNameFromEmail(email: string | null): string {
  if (email == null || !email.includes("@")) return "there";
  const local = email.split("@")[0]?.replace(/[.+_]/g, " ").trim() ?? "";
  const first = local.split(/\s+/)[0] ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function DashboardPageHeader({
  weekRangeLabel,
}: {
  weekRangeLabel: string;
}) {
  const { email } = useAdminWorkspace();
  const name = greetingNameFromEmail(email);

  return (
    <AdminPageIntro
      title={
        <>
          Hey {name}{" "}
          <span className="font-normal" aria-hidden>
            👋
          </span>
        </>
      }
      subtitle={weekRangeLabel}
      action={
        <Link
          href="/admin/shows/new"
          className={`${workspaceActionPrimaryMd} w-full justify-center sm:w-auto`}
        >
          <WorkspaceActionLabel
            icon={<PlusIcon className={workspaceActionIconMd} />}
          >
            Show
          </WorkspaceActionLabel>
        </Link>
      }
    />
  );
}
