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
        'upgrade': {
          'dark-blue': '#154F72',
          'light-blue': '#73D4F5', 
          'medium-blue': '#146BA2',
          'bright-blue': '#007EAF',
          'dark-gray': '#475359',
          'black': '#1A1A1A',
        },
        // Keep old colors for backward compatibility
        'upgrade-blue': '#146BA2',
        'upgrade-light-blue': '#007EAF', 
        'upgrade-cyan': '#73D4F5',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config