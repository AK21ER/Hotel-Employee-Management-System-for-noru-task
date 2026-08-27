/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noru: {
          50: '#fdfbf7',
          100: '#f9f5ea',
          200: '#f0e5cb',
          300: '#e3cfa1',
          400: '#d5b672',
          500: '#c29b38', // Brand Gold
          600: '#a9822a',
          700: '#876420',
          800: '#6c4f1c',
          900: '#563e18',
          950: '#31210a',
        },
        espresso: {
          50: '#f7f6f5',
          100: '#ece9e6',
          200: '#d7d0ca',
          300: '#b8aca1',
          400: '#8e7d70',
          500: '#6f5e51',
          600: '#56473c',
          700: '#41352c',
          800: '#2c221a',
          900: '#1d140d', // Brand Dark
          950: '#140c06',
        },
        brand: {
          50: '#fdfbf7',
          100: '#f9f5ea',
          200: '#f0e5cb',
          300: '#e3cfa1',
          400: '#d5b672',
          500: '#c29b38',
          600: '#a9822a',
          700: '#876420',
          800: '#6c4f1c',
          900: '#1d140d',
        },
      },
    },
  },
  plugins: [],
}
