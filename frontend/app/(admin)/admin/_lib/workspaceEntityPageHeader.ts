import type { ReactNode } from 'react';
import type { WorkspacePageHeaderProps } from '../_components/workspace/WorkspacePageHeader';

/**
 * Entity/detail pages — back nav + title share the left slot in the utilities row.
 * Use for Show Detail, Vendor Detail (when migrated), etc.
 */
export function workspaceEntityPageHeader({
  leading,
  title,
  subtitle,
  actions,
  showUtilities = true,
}: {
  /** Back link or parent nav (e.g. ← Shows). */
  leading: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  showUtilities?: boolean;
}): WorkspacePageHeaderProps {
  return { leading, title, subtitle, actions, showUtilities };
}
