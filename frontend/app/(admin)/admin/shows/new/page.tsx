"use client";

import Link from "next/link";
import {
  AdminPageContainer,
  AdminPageIntroSection,
} from "@/app/(admin)/admin/_components/AdminPageContainer";
import { AdminPageIntro } from "@/app/(admin)/admin/_components/AdminPageIntro";
import { workspacePageContentWidthWide } from "@/app/(admin)/admin/_components/workspaceUi";
import { ShowCreateForm } from "./ShowCreateForm";

function CreateShowBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-medium leading-snug">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-stone-600">
        <li>
          <Link
            href="/admin/shows"
            className="rounded-sm text-stone-800 underline decoration-stone-400/80 underline-offset-[3px] transition-colors hover:text-stone-950 hover:decoration-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
          >
            Shows
          </Link>
        </li>
        <li className="select-none text-stone-300" aria-hidden>
          /
        </li>
        <li className="min-w-0 max-w-full text-stone-900" aria-current="page">
          <span className="block truncate font-semibold tracking-tight">
            Create show
          </span>
        </li>
      </ol>
    </nav>
  );
}

export default function AdminShowsNewPage() {
  return (
    <>
      <AdminPageIntroSection variant="entity-detail">
        <AdminPageIntro
          variant="entity-detail"
          breadcrumb={<CreateShowBreadcrumb />}
          title="Create show"
        />
      </AdminPageIntroSection>

      <AdminPageContainer contentWidthClassName={workspacePageContentWidthWide}>
        <ShowCreateForm />
      </AdminPageContainer>
    </>
  );
}
