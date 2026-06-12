import type { WorkspaceContainerTier } from './workspacePageContentWidth';

/**
 * Default **page content** container tier by admin route.
 * Header chrome spans the app canvas (`workspaceHeaderCanvasFrameClass`), not this map.
 * Pages should pass the same tier to {@link AdminWorkspacePageLayout} / {@link AdminPageContainer}.
 */
export function workspaceContainerTierForPath(
  pathname: string,
): WorkspaceContainerTier {
  const path = pathname.split('?')[0] ?? '';

  if (
    path.startsWith('/admin/settings') ||
    path.startsWith('/admin/payments/new')
  ) {
    return 'compact';
  }

  if (path === '/admin/shows/new' || path.includes('/batch-pay')) {
    return 'wide';
  }

  if (
    path === '/admin/dashboard' ||
    path.startsWith('/admin/dashboard/') ||
    path === '/admin/shows' ||
    path.startsWith('/admin/shows/') ||
    path.startsWith('/admin/vendors') ||
    path.startsWith('/admin/balances') ||
    path.startsWith('/admin/wholesalers/') ||
    path.startsWith('/admin/ledger') ||
    path.startsWith('/admin/financials/activity') ||
    path.startsWith('/admin/purchases') ||
    path.startsWith('/admin/spending') ||
    path.startsWith('/admin/business-health') ||
    path.startsWith('/admin/owner') ||
    path.startsWith('/admin/balances/owner')
  ) {
    return 'full';
  }

  return 'standard';
}
