import type { ReactNode } from "react";
import {
  publicFeatureIconWellClass,
  publicFeatureTextClass,
} from "../shell/publicShell";

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
      <span className={publicFeatureIconWellClass} aria-hidden>
        {icon}
      </span>
      <div className={publicFeatureTextClass}>
        <p className="font-fefe text-sm font-semibold leading-snug text-fefe-charcoal">
          {title}
        </p>
        <p className="mt-0.5 font-fefe text-sm leading-snug text-fefe-charcoal">
          {description}
        </p>
      </div>
    </>
  );
}
