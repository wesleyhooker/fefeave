"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { workspacePageIntroAccent } from "./workspaceUi";

export function AdminPageIntro({
  title,
  subtitle,
  action,
  useAccent = false,
  /** Boutique wave is opt-in only; default is clean intro matching Dashboard. */
  decoration = "none",
  variant = "default",
  breadcrumb,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  useAccent?: boolean;
  decoration?: "none" | "boutique";
  /** `entity-detail`: compact header, no wave — for nested entity pages (e.g. wholesaler). */
  variant?: "default" | "entity-detail";
  /** Shown above the title (e.g. breadcrumb `Balances / Name`). */
  breadcrumb?: ReactNode;
}) {
  const effectiveDecoration = variant === "entity-detail" ? "none" : decoration;
  const effectiveUseAccent = variant === "entity-detail" ? false : useAccent;

  const innerPadding = "py-4 md:py-5";

  const titleClassName =
    variant === "entity-detail"
      ? "text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl"
      : "text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl";

  const subtitleClassName =
    variant === "entity-detail"
      ? "max-w-prose text-sm leading-snug text-stone-500"
      : "max-w-prose text-sm font-medium leading-relaxed text-stone-600";

  const SubtitleContainer = variant === "entity-detail" ? "div" : "p";

  const identityBlockClassName = "";

  return (
    <header className="relative isolate overflow-x-clip overflow-y-hidden">
      {effectiveDecoration === "boutique" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-x-clip overflow-y-hidden [contain:paint]"
        >
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-[24rem] overflow-x-clip overflow-y-hidden sm:w-[48%] sm:max-w-[20rem] lg:w-[58%] lg:max-w-[40rem]">
            <div className="relative h-full min-h-0 w-full">
              <Image
                src="/images/admin/page-intro-wave-soft-boutique.svg"
                alt=""
                width={900}
                height={180}
                className="absolute left-[-68%] top-[48%] h-auto max-h-full w-[188%] max-w-none -translate-y-1/2 opacity-95 sm:left-[-56%] sm:top-[72%] sm:w-[172%] lg:left-[-100%] lg:top-[66%] lg:w-[230%] lg:-translate-x-[4%]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[min(28%,10rem)] bg-gradient-to-r from-[rgba(250,247,246,0.97)] via-[rgba(250,247,246,0.55)] to-transparent sm:w-[min(24%,9rem)]" />
            </div>
          </div>
        </div>
      ) : null}

      <div className={`relative z-10 ${innerPadding}`}>
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div
            className={`min-w-0 flex-1 ${effectiveUseAccent ? workspacePageIntroAccent : ""} ${identityBlockClassName}`}
          >
            {breadcrumb ? (
              <div className="mb-1.5 sm:mb-2">{breadcrumb}</div>
            ) : null}
            <div className="space-y-2">
              <h1 className={titleClassName}>{title}</h1>
              {subtitle ? (
                <SubtitleContainer className={subtitleClassName}>
                  {subtitle}
                </SubtitleContainer>
              ) : null}
            </div>
          </div>
          {action ? (
            <div className="flex w-full shrink-0 justify-start sm:w-auto sm:justify-end sm:self-center [&>*]:w-full sm:[&>*]:w-auto">
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
