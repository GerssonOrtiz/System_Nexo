/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Dark Forge palette
        'bg-forge':      '#050811',
        'bg-forge-mid':  '#090D1A',
        'bg-forge-high': '#0E1424',
        'bg-base':       '#0A0F1E',
        'bg-surface':    '#111827',
        'bg-elevated':   '#1a2236',
        // Neon accents
        'neon-blue':     '#00D2FF',
        'neon-purple':   '#818CF8',
        'amber-core':    '#00D2FF',
        'amber-glow':    '#38BDF8',
        'amber-deep':    '#0284C7',
        'forge-orange':  '#6366F1',
        'forge-bright':  '#818CF8',
        // Text & border
        'text-primary':   '#F1F5F9',
        'text-secondary': '#94A3B8',
        'border-subtle':  'rgba(255,255,255,0.08)',
      },
      animation: {
        'float-1': 'float-orb 6s ease-in-out infinite',
        'float-2': 'float-orb 8s ease-in-out infinite 2s',
        'float-3': 'float-orb 10s ease-in-out infinite 4s',
        'slide-in': 'slide-in 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'float-orb': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '0.6' },
          '50%':      { transform: 'translateY(-24px) scale(1.08)', opacity: '0.9' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0px)' },
        },
      },
    },
  },
  plugins: [],
};
