import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0D0D0D',
        ink:     '#F0EDE8',
        accent:  '#9B2B2B',
        'acc-h': '#B03030',
      },
      fontFamily: {
        sans:    ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        display: ['var(--font-barlow)', 'sans-serif'],
      },
      animation: {
        marquee: 'march 30s linear infinite',
        pulse:   'ledpulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        march: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        ledpulse: {
          '0%,100%': { opacity: '1',   boxShadow: '0 0 8px #9B2B2B' },
          '50%':     { opacity: '0.4', boxShadow: '0 0 3px #9B2B2B' },
        },
      },
    },
  },
  plugins: [],
}

export default config
