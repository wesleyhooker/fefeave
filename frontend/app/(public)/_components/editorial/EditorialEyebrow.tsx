import type { ReactNode } from "react";
import { HeartIcon } from "@/app/_components/icons/HeartIcon";

export type EditorialEyebrowProps = {
  children: ReactNode;
  /** Set false to omit the default heart (e.g. Live page eyebrow). */
  showIcon?: boolean;
  icon?: ReactNode;
  /** Center eyebrow + icon (section headers below hero). */
  centered?: boolean;
  className?: string;
};

export function EditorialEyebrow({
  children,
  showIcon = true,
  icon = <HeartIcon className="h-3 w-3 shrink-0 text-fefe-gold" />,
  centered = false,
  className = "",
}: EditorialEyebrowProps) {
  return (
    <p
      className={`mb-fefe-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-fefe text-fefe-micro tracking-fefe-micro font-medium uppercase text-fefe-gold ${centered ? "justify-center" : ""} ${className}`.trim()}
    >
      {children}
      {showIcon ? icon : null}
    </p>
  );
}
