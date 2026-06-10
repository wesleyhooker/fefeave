/**
 * Reseller workspace v2 — primary sidebar navigation and route constants.
 * @see docs/product/reseller-workspace-v2.md
 */

export const DASHBOARD_HREF = '/admin/dashboard';
export const SHOWS_HREF = '/admin/shows';
export const VENDORS_HREF = '/admin/vendors';
export const PURCHASES_HREF = '/admin/purchases';
/** @deprecated Legacy URL — redirects to {@link PURCHASES_HREF}. */
export const SPENDING_HREF = '/admin/spending';
export const BUSINESS_HEALTH_HREF = '/admin/business-health';
/** @deprecated Use {@link BUSINESS_HEALTH_HREF}. */
export const OWNER_HREF = BUSINESS_HEALTH_HREF;
export const LEDGER_HREF = '/admin/ledger';
export const SETTINGS_HREF = '/admin/settings';
export const SETTINGS_ACCOUNTS_HREF = '/admin/settings/accounts';
export const SETTINGS_FINANCIAL_HREF = '/admin/settings/financial';

export type AdminPrimaryNavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export function isDashboardPath(path: string): boolean {
  return (
    path === '/admin' || path === DASHBOARD_HREF || path === '/admin/financials'
  );
}

export function isShowsPath(path: string): boolean {
  return path.startsWith('/admin/shows');
}

export function isVendorsPath(path: string): boolean {
  return (
    path === VENDORS_HREF ||
    path.startsWith(`${VENDORS_HREF}/`) ||
    path.startsWith('/admin/balances') ||
    path.startsWith('/admin/wholesalers') ||
    path.startsWith('/admin/payments')
  );
}

export function isPurchasesPath(path: string): boolean {
  const base = path.split('?')[0] ?? path;
  return (
    base === PURCHASES_HREF ||
    base.startsWith(`${PURCHASES_HREF}/`) ||
    base === SPENDING_HREF ||
    base.startsWith(`${SPENDING_HREF}/`) ||
    base.startsWith('/admin/expenses') ||
    base.startsWith('/admin/inventory')
  );
}

/** @deprecated Use {@link isPurchasesPath}. */
export function isSpendingPath(path: string): boolean {
  return isPurchasesPath(path);
}

export function isBusinessHealthPath(path: string): boolean {
  return (
    path === BUSINESS_HEALTH_HREF ||
    path.startsWith(`${BUSINESS_HEALTH_HREF}/`) ||
    path === '/admin/owner' ||
    path.startsWith('/admin/owner/') ||
    path.startsWith('/admin/balances/owner')
  );
}

/** @deprecated Use {@link isBusinessHealthPath}. */
export function isOwnerPath(path: string): boolean {
  return isBusinessHealthPath(path);
}

export function isSettingsPath(path: string): boolean {
  return (
    path === SETTINGS_HREF ||
    path.startsWith(`${SETTINGS_HREF}/`) ||
    path.startsWith('/admin/balances/accounts') ||
    path.startsWith('/admin/strategy')
  );
}

export const PRIMARY_NAV_ITEMS: AdminPrimaryNavItem[] = [
  {
    href: DASHBOARD_HREF,
    label: 'Dashboard',
    match: isDashboardPath,
  },
  {
    href: SHOWS_HREF,
    label: 'Shows',
    match: isShowsPath,
  },
  {
    href: VENDORS_HREF,
    label: 'Vendors',
    match: isVendorsPath,
  },
  {
    href: PURCHASES_HREF,
    label: 'Purchases',
    match: isPurchasesPath,
  },
  {
    href: BUSINESS_HEALTH_HREF,
    label: 'Business Health',
    match: isBusinessHealthPath,
  },
];

export function isPrimaryNavItemActive(
  item: AdminPrimaryNavItem,
  path: string,
): boolean {
  return item.match(path);
}

/** Workspace segment for entity-detail breadcrumbs. */
export const FINANCIALS_WORKSPACE_BREADCRUMB = {
  href: DASHBOARD_HREF,
  label: 'Dashboard',
} as const;

/** Vendor list segment (balances / vendors list). */
export const BALANCES_PAGE_BREADCRUMB = {
  href: VENDORS_HREF,
  label: 'Vendors',
} as const;
