import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'upgrade-blue': '#0066CC',
        'upgrade-light-blue': '#00A6E0', 
        'upgrade-cyan': '#4DC8E8',
      },
    },
  },
  plugins: [],
}
export default config