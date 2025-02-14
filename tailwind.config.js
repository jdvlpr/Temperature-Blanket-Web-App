/**
 * SKELETON MIGRATION NOTICE
 *
 * The following custom themes were detected and commented out due to them not being compatible with the V3 theme format:
 *
 * - classic
 *
 * See https://github.com/skeletonlabs/skeleton/discussions/2921 for info on how to migrate these yourself.
 */
import { fontFamily } from 'tailwindcss/defaultTheme';
import { join } from 'path';
// import { classic } from './classic-theme';
import { contentPath, skeleton } from '@skeletonlabs/skeleton/plugin';
import * as themes from '@skeletonlabs/skeleton/themes';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    contentPath(import.meta.url, 'svelte'),
  ],
  safelist: ['dark'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        tmin: '#38bdf8',
        tavg: '#a3a3a3',
        tmax: '#f87171',
        prcp: '#818cf8',
        snow: '#94a3b8',
        dayt: '#facc15',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [...fontFamily.sans],
        sans_light: ['apparat-light', 'sans-serif'],
        cursive: ['epicursive, cursive, sans-serif'],
        ornament: ['beloved-ornaments,sans-serif'],
      },
      transitionProperty: {
        width: 'width',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    skeleton({
      themes: [
        // classic,
        themes.crimson,
        themes.hamlindigo,
        themes.modern,
        themes.rocket,
        themes.legacy,
      ],
    }),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
