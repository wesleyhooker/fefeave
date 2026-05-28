"use client";

import { AdminEntityBreadcrumb } from "@/app/(admin)/admin/_components/AdminEntityBreadcrumb";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { AdminWorkspacePageLayout } from "@/app/(admin)/admin/_components/AdminWorkspacePageLayout";
import { workspacePageContentWidthWide } from "@/app/(admin)/admin/_components/workspaceUi";
import { WORKFLOW_LOG_SHOW_PANEL_TITLE } from "@/app/(admin)/admin/_lib/adminWorkflowCopy";
import { ShowCreateForm } from "./ShowCreateForm";

export default function AdminShowsNewPage() {
  return (
    <AdminWorkspacePageLayout
      introVariant="entity-detail"
      contentWidthClassName={workspacePageContentWidthWide}
      intro={
        <AdminPageIntro
          variant="entity-detail"
          breadcrumb={
            <AdminEntityBreadcrumb
              segments={[
                { href: "/admin/shows", label: "Shows" },
                { label: WORKFLOW_LOG_SHOW_PANEL_TITLE, current: true },
              ]}
            />
          }
          title={WORKFLOW_LOG_SHOW_PANEL_TITLE}
        />
      }
    >
      <ShowCreateForm />
    </AdminWorkspacePageLayout>
  );
}
