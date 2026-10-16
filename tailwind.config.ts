import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Public Sans Variable"', 'system-ui', 'sans-serif'],
        body: ['"Public Sans Variable"', 'system-ui', '"Noto Sans Devanagari"', '"Noto Sans Gurmukhi"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Kannada"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', 'sans-serif'],
        // Numbers use the body face with tabular figures; no monospace labels.
        mono: ['"Public Sans Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--foreground) / <alpha-value>)' },
        popover: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--foreground) / <alpha-value>)' },
        primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
        secondary: { DEFAULT: 'hsl(var(--secondary) / <alpha-value>)', foreground: 'hsl(var(--foreground) / <alpha-value>)' },
        muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
        accent: { DEFAULT: 'hsl(var(--accent) / <alpha-value>)', foreground: 'hsl(var(--accent-foreground) / <alpha-value>)' },
        destructive: { DEFAULT: 'hsl(var(--bad) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
        // Meaning colours: observed = soil, model = blue, status = good / warn / bad
        observed: 'hsl(var(--accent) / <alpha-value>)',
        model: { DEFAULT: 'hsl(var(--model) / <alpha-value>)', ink: 'hsl(var(--model-ink) / <alpha-value>)' },
        good: 'hsl(var(--good) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        bad: 'hsl(var(--bad) / <alpha-value>)',
        sage: 'hsl(var(--good) / <alpha-value>)',
        amber: 'hsl(var(--warn) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        sidebar: { DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)', foreground: 'hsl(var(--foreground) / <alpha-value>)', border: 'hsl(var(--border) / <alpha-value>)' },
      },
      boxShadow: {
        'premium': '0 1px 0 hsl(var(--border))',
        'glow': '0 0 0 1px hsl(var(--foreground) / 0.12)',
        'glow-amber': '0 0 0 1px hsl(var(--accent) / 0.3)',
        'card-hover': '0 0 0 1px hsl(var(--foreground) / 0.18)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      transitionTimingFunction: { calm: 'cubic-bezier(.2,0,0,1)' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'live-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.7' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'live-dot': 'live-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
