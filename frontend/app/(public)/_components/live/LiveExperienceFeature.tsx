import type { ReactNode } from "react";
import { homepageIconFeatureTextClass } from "../homepageShell";

export type LiveExperienceFeatureProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function LiveExperienceFeature({
  icon,
  title,
  description,
}: LiveExperienceFeatureProps) {
  return (
    <>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fefe-icon-well md:h-14 md:w-14"
        aria-hidden
      >
        {icon}
      </span>
      <div className={homepageIconFeatureTextClass}>
        <p className="font-fefe text-sm font-semibold leading-snug text-fefe-charcoal">
          {title}
        </p>
        <p className="mt-0.5 font-fefe text-sm leading-snug text-fefe-charcoal/85">
          {description}
        </p>
      </div>
    </>
  );
}
