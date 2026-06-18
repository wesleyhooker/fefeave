"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from "react";
import {
  WORKSPACE_SECTION_CARD,
  WORKSPACE_SECTION_CARD_BODY,
  WORKSPACE_SECTION_CARD_DESCRIPTION,
  WORKSPACE_SECTION_CARD_TITLE,
} from "@/app/(admin)/admin/_lib/workspaceEntityDetailLayout";

export type WorkspaceSectionCardProps = {
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Optional wrapper around children (flash rings, scroll anchors). */
  contentRef?: Ref<HTMLDivElement>;
  contentClassName?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">;

/**
 * Primary content section on entity detail pages — shared header rhythm.
 */
export const WorkspaceSectionCard = forwardRef<
  HTMLElement,
  WorkspaceSectionCardProps
>(function WorkspaceSectionCard(
  {
    title,
    titleId,
    description,
    children,
    className = "",
    bodyClassName = "",
    contentRef,
    contentClassName = "",
    ...rest
  },
  ref,
) {
  const headingId = titleId ?? "workspace-section-card-heading";

  return (
    <section
      ref={ref}
      className={`${WORKSPACE_SECTION_CARD} ${className}`.trim()}
      aria-labelledby={headingId}
      {...rest}
    >
      <div className={`${WORKSPACE_SECTION_CARD_BODY} ${bodyClassName}`.trim()}>
        <h2 id={headingId} className={WORKSPACE_SECTION_CARD_TITLE}>
          {title}
        </h2>
        {description ? (
          <p className={WORKSPACE_SECTION_CARD_DESCRIPTION}>{description}</p>
        ) : null}
        <div
          ref={contentRef}
          tabIndex={contentRef ? -1 : undefined}
          className={`mt-3 ${contentClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </section>
  );
});
