import { defineConfig } from '@tailwindcss/postcss'

export default defineConfig({
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'libran-gold': '#ffd700',
        'libran-blue': '#0f3460',
        'libran-dark': '#16213e',
        'libran-darker': '#1a1a2e',
        'libran-red': '#e94560',
        'libran-accent': '#4a90e2',
      },
    },
  },
})
