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
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  useAccent?: boolean;
  decoration?: "none" | "boutique";
}) {
  return (
    <header className="relative overflow-hidden">
      {decoration === "boutique" ? (
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

      <div className="relative z-10 py-2.5 md:py-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div
            className={`min-w-0 ${useAccent ? workspacePageIntroAccent : ""}`}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm font-medium tabular-nums text-stone-600">
                {subtitle}
              </p>
            ) : null}
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
