/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#E6FAFA',
          100: '#BFFAF4',
          200: '#80EDE4',
          400: '#26D4C8',
          500: '#00C4B4',
          600: '#00A99D',
          700: '#008880',
          800: '#00635D',
        },
        accent:  '#FCCB30',
        income:  '#22C55E',
        expense: '#EF4444',
        surface: '#F2FAFA',
        dark:    '#111111',
      },
      boxShadow: {
        'card':    '0 2px 8px 0 rgba(0,196,180,0.10)',
        'primary': '0 4px 20px 0 rgba(0,196,180,0.30)',
        'accent':  '0 4px 16px 0 rgba(252,203,48,0.40)',
        'bold':    '4px 4px 0px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
