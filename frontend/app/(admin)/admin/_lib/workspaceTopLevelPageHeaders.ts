import type { WorkspacePageHeaderProps } from '../_components/workspace/WorkspacePageHeader';
import {
  WORKFLOW_BUSINESS_HEALTH_SUBTITLE,
  WORKFLOW_BUSINESS_HEALTH_TITLE,
  WORKFLOW_PURCHASES_PAGE_SUBTITLE,
  WORKFLOW_SHOWS_PAGE_SUBTITLE,
  WORKFLOW_VENDORS_PAGE_SUBTITLE,
} from './adminWorkflowCopy';

/**
 * Static copy for primary reseller workspace index pages.
 * Pass to {@link AdminWorkspacePageLayout} `pageHeader` — do not duplicate title/subtitle per page state.
 */
export const WORKSPACE_TOP_LEVEL_PAGE_HEADERS = {
  shows: {
    title: 'Shows',
    subtitle: WORKFLOW_SHOWS_PAGE_SUBTITLE,
  },
  vendors: {
    title: 'Vendors',
    subtitle: WORKFLOW_VENDORS_PAGE_SUBTITLE,
  },
  purchases: {
    title: 'Purchases',
    subtitle: WORKFLOW_PURCHASES_PAGE_SUBTITLE,
  },
  businessHealth: {
    title: WORKFLOW_BUSINESS_HEALTH_TITLE,
    subtitle: WORKFLOW_BUSINESS_HEALTH_SUBTITLE,
  },
} as const satisfies Record<string, WorkspacePageHeaderProps>;

export type WorkspaceTopLevelPageKey =
  keyof typeof WORKSPACE_TOP_LEVEL_PAGE_HEADERS;
