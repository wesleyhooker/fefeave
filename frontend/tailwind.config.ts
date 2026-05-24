import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fefe: {
          cream: 'var(--fefe-cream)',
          'cream-raised': 'var(--fefe-cream-raised)',
          'warm-sand': 'var(--fefe-warm-sand)',
          'sand-muted': 'var(--fefe-sand-muted)',
          stone: 'var(--fefe-stone)',
          charcoal: 'var(--fefe-charcoal)',
          gold: 'var(--fefe-gold)',
          'gold-hover': 'var(--fefe-gold-hover)',
          blush: 'var(--fefe-blush)',
          sage: 'var(--fefe-sage)',
          'trust-gold': 'var(--fefe-trust-gold)',
          'icon-well': 'var(--fefe-icon-well)',
        },
        /**
         * Admin workspace brand palette (admin-only).
         * Bound to `--admin-*` CSS vars in `frontend/system/tokens.css`,
         * which store space-separated RGB tuples. The `<alpha-value>`
         * placeholder lets Tailwind compose opacity modifiers like
         * `bg-admin-brand/40` and `outline-admin-brand/40`.
         */
        admin: {
          /** Legacy rose/blush — retained for backward compatibility */
          brand: 'rgb(var(--admin-brand) / <alpha-value>)',
          brandHover: 'rgb(var(--admin-brand-hover) / <alpha-value>)',
          surfaceSubtle: 'rgb(var(--admin-surface-subtle) / <alpha-value>)',
          surfaceActive: 'rgb(var(--admin-surface-active) / <alpha-value>)',
          surfaceHover: 'rgb(var(--admin-surface-hover) / <alpha-value>)',
          borderWarm: 'rgb(var(--admin-border-warm) / <alpha-value>)',
          /** Warm boutique operations semantic chrome */
          canvas: 'rgb(var(--admin-canvas) / <alpha-value>)',
          sidebarSurface: 'rgb(var(--admin-sidebar-surface) / <alpha-value>)',
          sidebarSurfaceDeep:
            'rgb(var(--admin-sidebar-surface-deep) / <alpha-value>)',
          sidebarNavHoverSurface:
            'rgb(var(--admin-sidebar-nav-hover-surface) / <alpha-value>)',
          sidebarNavActiveSurface:
            'rgb(var(--admin-sidebar-nav-active-surface) / <alpha-value>)',
          sidebarText: 'rgb(var(--admin-sidebar-text) / <alpha-value>)',
          sidebarTextMuted:
            'rgb(var(--admin-sidebar-text-muted) / <alpha-value>)',
          sidebarDivider: 'rgb(var(--admin-sidebar-divider) / <alpha-value>)',
          headerSurface: 'rgb(var(--admin-header-surface) / <alpha-value>)',
          headerBorder: 'rgb(var(--admin-header-border) / <alpha-value>)',
          surfaceElevated: 'rgb(var(--admin-surface-elevated) / <alpha-value>)',
          border: 'rgb(var(--admin-border) / <alpha-value>)',
          mutedStrip: 'rgb(var(--admin-muted-strip) / <alpha-value>)',
          ink: 'rgb(var(--admin-ink) / <alpha-value>)',
          inkMuted: 'rgb(var(--admin-ink-muted) / <alpha-value>)',
          kpiSoft: 'rgb(var(--admin-kpi-soft) / <alpha-value>)',
          kpiAccent: 'rgb(var(--admin-kpi-accent) / <alpha-value>)',
          kpiGold: 'rgb(var(--admin-kpi-gold) / <alpha-value>)',
          kpiSage: 'rgb(var(--admin-kpi-sage) / <alpha-value>)',
          actionPrimary: 'rgb(var(--admin-action-primary) / <alpha-value>)',
          actionPrimaryHover:
            'rgb(var(--admin-action-primary-hover) / <alpha-value>)',
        },
      },
      spacing: {
        'fefe-1': 'var(--fefe-space-1)',
        'fefe-2': 'var(--fefe-space-2)',
        'fefe-3': 'var(--fefe-space-3)',
        'fefe-4': 'var(--fefe-space-4)',
        'fefe-5': 'var(--fefe-space-5)',
        'fefe-6': 'var(--fefe-space-6)',
        'fefe-7': 'var(--fefe-space-7)',
      },
      fontFamily: {
        fefe: ['var(--fefe-font-body)'],
        'fefe-heading': ['var(--fefe-font-heading)'],
      },
      fontSize: {
        /** Size only — pair with tracking on EditorialEyebrow, not footer */
        'fefe-micro': 'var(--fefe-micro-size)',
      },
      letterSpacing: {
        'fefe-micro': 'var(--fefe-micro-tracking)',
      },
      borderRadius: {
        'fefe-card': 'var(--fefe-card-radius)',
        'fefe-button': 'var(--fefe-button-radius)',
      },
      maxWidth: {
        'fefe-container': 'var(--fefe-container-max)',
        'fefe-narrow': 'var(--fefe-container-narrow)',
        'fefe-editorial': 'var(--fefe-editorial-max)',
        'fefe-editorial-xl': 'var(--fefe-editorial-max-xl)',
      },
      boxShadow: {
        'fefe-card': '0 2px 12px rgba(44, 44, 44, 0.06)',
        /** Editorial homepage cards on cream canvas */
        'fefe-card-editorial':
          '0 1px 2px rgba(72, 53, 47, 0.05), 0 4px 14px -2px rgba(72, 53, 47, 0.07)',
        /** Admin workspace — soft lift for elevated surfaces */
        'workspace-surface':
          '0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 28px -8px rgba(15, 23, 42, 0.1)',
        'workspace-surface-sm':
          '0 1px 2px rgba(15, 23, 42, 0.05), 0 5px 16px -4px rgba(15, 23, 42, 0.08)',
        /** Warm stone tint — cards/KPI on cream canvas */
        'workspace-surface-warm':
          '0 1px 2px rgba(72, 53, 47, 0.06), 0 10px 28px -8px rgba(72, 53, 47, 0.09)',
        'workspace-surface-warm-sm':
          '0 1px 2px rgba(72, 53, 47, 0.05), 0 5px 16px -4px rgba(72, 53, 47, 0.07)',
      },
    },
  },
  plugins: [],
};

export default config;
