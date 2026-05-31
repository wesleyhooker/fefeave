/**
 * Admin sidebar navigation — top-level workspaces and Financials children.
 * Routes stay under `/admin/balances`, `/admin/payments`, etc. (P0: labels only).
 */

export const FINANCIALS_WORKSPACE_LABEL = 'Financials';

/** Financials workspace landing page (Overview / Decision Center). */
export const FINANCIALS_OVERVIEW_HREF = '/admin/financials';

/** Balances list route (kept stable for existing balances breadcrumbs/links). */
export const FINANCIALS_LANDING_HREF = '/admin/balances';

export type AdminSidebarChildNavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export const FINANCIALS_NAV_CHILDREN: AdminSidebarChildNavItem[] = [
  {
    href: FINANCIALS_OVERVIEW_HREF,
    label: 'Overview',
    match: (path) => path === FINANCIALS_OVERVIEW_HREF,
  },
  {
    href: '/admin/financials/activity',
    label: 'Activity',
    match: (path) => path.startsWith('/admin/financials/activity'),
  },
  {
    href: FINANCIALS_LANDING_HREF,
    label: 'Balances',
    match: (path) =>
      path === FINANCIALS_LANDING_HREF || path.startsWith('/admin/wholesalers'),
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    match: (path) => path.startsWith('/admin/payments'),
  },
  {
    href: '/admin/balances/accounts',
    label: 'Accounts',
    match: (path) => path.startsWith('/admin/balances/accounts'),
  },
  {
    href: '/admin/balances/owner',
    label: 'Owner Activity',
    match: (path) => path.startsWith('/admin/balances/owner'),
  },
  {
    href: '/admin/inventory',
    label: 'Inventory',
    match: (path) => path.startsWith('/admin/inventory'),
  },
  {
    href: '/admin/expenses',
    label: 'Expenses',
    match: (path) => path.startsWith('/admin/expenses'),
  },
  {
    href: '/admin/strategy',
    label: 'Strategy',
    match: (path) => path.startsWith('/admin/strategy'),
  },
];

export function isFinancialsSectionActive(path: string): boolean {
  return FINANCIALS_NAV_CHILDREN.some((item) => item.match(path));
}

export function isFinancialsChildActive(
  item: AdminSidebarChildNavItem,
  path: string,
): boolean {
  return item.match(path);
}

/** Workspace segment for entity-detail breadcrumbs — points at the Overview landing. */
export const FINANCIALS_WORKSPACE_BREADCRUMB = {
  href: FINANCIALS_OVERVIEW_HREF,
  label: FINANCIALS_WORKSPACE_LABEL,
} as const;

/** Balances list segment (child page within Financials). */
export const BALANCES_PAGE_BREADCRUMB = {
  href: FINANCIALS_LANDING_HREF,
  label: 'Balances',
} as const;
