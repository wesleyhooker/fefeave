import {
  AdminWorkspacePageIntro,
  AdminWorkspacePageLayout,
} from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { SETTINGS_FINANCIAL_HREF } from "@/app/(admin)/admin/_lib/adminSidebarNav";
import {
  WorkspaceCard,
  WorkspaceCardBody,
} from "@/app/(admin)/admin/_components/WorkspaceCard";
import {
  WorkspaceGrid,
  WorkspaceGridItem,
} from "@/app/(admin)/admin/_components/WorkspaceGrid";
import Link from "next/link";
import {
  workspaceNavItemBase,
  workspaceNavItemInactive,
} from "@/app/(admin)/admin/_components/workspaceUi";

const SETTINGS_SECTIONS = [
  {
    href: SETTINGS_FINANCIAL_HREF,
    title: "Financial Preferences",
    description:
      "Allocation strategy, tax reserve, reinvestment, and cash buffer.",
  },
] as const;

export default function AdminSettingsPage() {
  return (
    <AdminWorkspacePageLayout
      containerTier="compact"
      intro={
        <AdminWorkspacePageIntro
          title="Settings"
          subtitle="Workspace configuration — not a daily workflow."
        />
      }
    >
      <WorkspaceGrid variant="stack" className="gap-3">
        {SETTINGS_SECTIONS.map((section) => (
          <WorkspaceGridItem key={section.href} span="full">
            <WorkspaceCard>
              <Link
                href={section.href}
                className={`${workspaceNavItemBase} ${workspaceNavItemInactive} block no-underline`}
              >
                <WorkspaceCardBody>
                  <p className="text-sm font-semibold text-stone-900">
                    {section.title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-stone-600">
                    {section.description}
                  </p>
                </WorkspaceCardBody>
              </Link>
            </WorkspaceCard>
          </WorkspaceGridItem>
        ))}
      </WorkspaceGrid>
    </AdminWorkspacePageLayout>
  );
}
