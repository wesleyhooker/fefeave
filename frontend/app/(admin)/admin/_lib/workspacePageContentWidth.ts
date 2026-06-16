/**
 * Left-anchored workspace container tiers — shell gutters + max-width cap.
 * @see docs/architecture/workspace-layout.md
 */

/** Horizontal padding inside the main column (paired with tier max-width). */
export const WORKSPACE_CONTAINER_GUTTER = 'px-4 md:px-6';

/**
 * Page chrome text inset — titles, subtitles, breadcrumbs, and section eyebrows
 * sit this far right of the container gutter edge. Compensates for rounded card
 * corners while staying tied to the card group. Cards and grids use gutter only.
 */
export const WORKSPACE_PAGE_CHROME_INSET_X = 'pl-1.5 md:pl-2';

/**
 * Horizontal margin inset inside hub cards — same rhythm as {@link WORKSPACE_CONTAINER_GUTTER}.
 * Use for alert bands and other inset blocks within a bordered surface.
 */
export const WORKSPACE_CONTAINER_INSET_X = 'mx-4 md:mx-6';

/**
 * Page frame max-widths (left-aligned in main canvas; no viewport subtraction).
 * compact 720px · standard 1200px · wide 1440px · full = canvas width (no cap)
 */
export const WORKSPACE_CONTAINER_TIER = {
  compact: 'w-full max-w-[45rem]',
  standard: 'w-full max-w-[75rem]',
  wide: 'w-full max-w-[90rem]',
  /**
   * Hub reference composition — left-anchored well for dashboard / future BH overview.
   * Wider than `standard` (75rem) but not centered; content aligns with shell gutters
   * after the sidebar. Does not affect `full` index pages.
   */
  hub: 'w-full max-w-[90rem]',
  /** Fills the main column after sidebar; same gutters as other tiers. */
  full: 'w-full min-w-0',
} as const;

export type WorkspaceContainerTier = keyof typeof WORKSPACE_CONTAINER_TIER;

/** @deprecated Prefer {@link WorkspaceContainerTier}. */
export type WorkspacePageWidthMode = WorkspaceContainerTier;

/** @deprecated Prefer {@link WORKSPACE_CONTAINER_TIER}. */
export const WORKSPACE_PAGE_CONTENT_WIDTH = WORKSPACE_CONTAINER_TIER;

export function workspaceContainerTierClass(
  tier: WorkspaceContainerTier = 'standard',
): string {
  return WORKSPACE_CONTAINER_TIER[tier];
}

/** Gutter + left-anchored tier — page intro and page content share the same left edge. */
export function workspaceContainerFrameClass(
  tier: WorkspaceContainerTier = 'standard',
): string {
  return `${WORKSPACE_CONTAINER_GUTTER} ${workspaceContainerTierClass(tier)}`;
}

/**
 * Header inner frame — full app canvas width with shell gutters only.
 * No max-width or mx-auto; page tiers apply only to intro/content.
 */
export function workspaceHeaderCanvasFrameClass(): string {
  return `${WORKSPACE_CONTAINER_GUTTER} w-full`;
}

/** @deprecated Use {@link workspaceHeaderCanvasFrameClass}. */
export function workspaceHeaderContainerFrameClass(): string {
  return workspaceHeaderCanvasFrameClass();
}

/** @deprecated Prefer {@link workspaceContainerTierClass}. */
export function workspacePageContentWidthClass(
  mode: WorkspaceContainerTier = 'standard',
): string {
  return workspaceContainerTierClass(mode);
}
