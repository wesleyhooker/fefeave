import type { ComponentType, SVGProps } from 'react';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import type { WorkspaceIconWellVariant } from '@/app/(admin)/admin/_components/workspace/WorkspaceIconWell';
import type { WorkspaceKpiEmbeddedValueTone } from '@/app/(admin)/admin/_components/workspace/WorkspaceKpiEmbeddedCell';
import type { DashboardWorkspaceCardAccent } from './dashboardWorkspaceCards';

/** Dashboard hero metric icons — domain mapping only (not styling). */
export const DASHBOARD_HERO_ICONS: Record<
  WorkspaceKpiEmbeddedValueTone,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  profit: CurrencyDollarIcon,
  liability: TruckIcon,
  count: CalendarDaysIcon,
  attention: ClockIcon,
};

export const DASHBOARD_HERO_ICON_WELL: Record<
  WorkspaceKpiEmbeddedValueTone,
  WorkspaceIconWellVariant
> = {
  profit: 'success',
  liability: 'liability',
  count: 'milestone',
  attention: 'attention',
};

export const DASHBOARD_OVERVIEW_ICONS = {
  shows: CalendarDaysIcon,
  vendors: TruckIcon,
  purchases: BanknotesIcon,
  businessHealth: UserCircleIcon,
} as const;

export const DASHBOARD_OVERVIEW_ICON_WELL: Record<
  keyof typeof DASHBOARD_OVERVIEW_ICONS,
  WorkspaceIconWellVariant
> = {
  shows: 'neutral',
  vendors: 'liability',
  purchases: 'liability',
  businessHealth: 'success',
};

/** Dashboard overview — public PNG paths for hub card illustrations. */
export const DASHBOARD_OVERVIEW_ILLUSTRATION_SRC: Record<
  DashboardWorkspaceCardAccent,
  string
> = {
  shows: '/illustrations/dashboard/shows.png',
  vendors: '/illustrations/dashboard/vendors.png',
  purchases: '/illustrations/dashboard/purchases.png',
  businessHealth: '/illustrations/dashboard/business-health.png',
};
