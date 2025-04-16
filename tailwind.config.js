import { fontFamily } from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f9faf4',
          100: '#f1f4e4',
          200: '#e2e9c7',
          300: '#ccd8a1',
          400: '#b3c376',
          500: '#96aa52',
          600: '#768a3e',
          700: '#5d6c32',
          800: '#4a562b',
          900: '#3d4726',
          950: '#1f2512',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e3e3e6',
          200: '#c7c7cd',
          300: '#a4a4ae',
          400: '#81818e',
          500: '#666674',
          600: '#515159',
          700: '#3d3d43',
          800: '#27272a',
          900: '#18181b',
          950: '#101012',
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro"', ...fontFamily.sans],
        serif: ['Freight Text Pro', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}