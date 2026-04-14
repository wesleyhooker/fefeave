"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { workspacePageIntroAccent } from "./workspaceUi";

export function AdminPageIntro({
  title,
  subtitle,
  action,
  useAccent = true,
  decoration = "boutique",
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

  const innerPadding = "py-2.5 md:py-3.5";

  const titleClassName =
    variant === "entity-detail"
      ? "text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl"
      : "text-2xl font-semibold tracking-tight text-stone-900";

  const subtitleClassName =
    variant === "entity-detail"
      ? "mt-1.5 max-w-prose text-sm leading-snug text-stone-500"
      : "mt-1 max-w-prose text-sm font-medium leading-snug text-stone-600";

  const identityBlockClassName =
    variant === "entity-detail"
      ? "border-l-[4px] border-stone-500/55 pl-3.5 sm:pl-4"
      : "";

  return (
    <header className="relative overflow-hidden">
      {effectiveDecoration === "boutique" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-[24rem] overflow-hidden sm:w-[48%] sm:max-w-[20rem] lg:w-[58%] lg:max-w-[40rem]">
            <div className="relative h-full w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_0%,black_100%)] sm:[mask-image:linear-gradient(to_right,transparent_0%,black_2%,black_100%)]">
              <Image
                src="/images/admin/page-intro-wave-soft-boutique.svg"
                alt=""
                width={900}
                height={180}
                className="absolute left-[-68%] top-[48%] h-auto w-[188%] max-w-none -translate-y-1/2 opacity-95 sm:left-[-56%] sm:top-[72%] sm:w-[172%] lg:left-[-100%] lg:top-[66%] lg:w-[230%] lg:-translate-x-[4%]"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className={`relative z-10 ${innerPadding}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div
            className={`min-w-0 ${effectiveUseAccent ? workspacePageIntroAccent : ""} ${identityBlockClassName}`}
          >
            {breadcrumb ? (
              <div className="mb-1.5 sm:mb-2">{breadcrumb}</div>
            ) : null}
            <h1 className={titleClassName}>{title}</h1>
            {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
          </div>
          {action ? (
            <div className="w-full pt-0.5 sm:w-auto sm:shrink-0 sm:pt-1 lg:pr-2">
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
