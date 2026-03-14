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
          'warm-sand': 'var(--fefe-warm-sand)',
          stone: 'var(--fefe-stone)',
          charcoal: 'var(--fefe-charcoal)',
          gold: 'var(--fefe-gold)',
          'gold-hover': 'var(--fefe-gold-hover)',
          blush: 'var(--fefe-blush)',
          sage: 'var(--fefe-sage)',
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
      borderRadius: {
        'fefe-card': 'var(--fefe-card-radius)',
        'fefe-button': 'var(--fefe-button-radius)',
      },
      maxWidth: {
        'fefe-container': 'var(--fefe-container-max)',
        'fefe-narrow': 'var(--fefe-container-narrow)',
      },
      boxShadow: {
        'fefe-card': '0 2px 12px rgba(44, 44, 44, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
