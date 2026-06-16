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
          50:  '#f5fcfc',
          100: '#e8f8f8',
          200: '#d4f2f2',
          400: '#c4eeee',
          500: '#bae8e8',
          600: '#85d6d6',
          700: '#41b8b8',
          800: '#206f6f',
        },
        accent:  '#ffd803',
        income:  '#22C55E',
        expense: '#EF4444',
        surface: '#f0fafa',
        dark:    '#111111',
        ink:     '#1a1a1a',
        gold:    '#FFB500',
        paper:   '#FFFBF3',
      },
      boxShadow: {
        'card':    '0 2px 8px 0 rgba(186,232,232,0.25)',
        'primary': '0 4px 20px 0 rgba(186,232,232,0.50)',
        'accent':  '0 4px 16px 0 rgba(255,216,3,0.40)',
        'bold':    '4px 4px 0px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
  safelist: [
    ...Array.from({ length: 101 }, (_, i) => `w-[${i}%]`),
  ],
}
