/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        walnut: { 950: '#140c07', 900: '#1f130b', 800: '#2e1c10', 700: '#3f2716', 600: '#5a3820' },
        cream: { 50: '#fffaf0', 100: '#f7eedb', 200: '#efe1c4', 300: '#e2cfa8' },
        beige: { 400: '#cbb38a', 500: '#b39a70' },
        gold: { 300: '#ead193', 400: '#d9b86a', 500: '#c49a45', 600: '#a07a2f' },
        burgundy: { 500: '#7c2130', 600: '#651a27', 700: '#4d121d', 800: '#360b14' },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        hand: ['Caveat', '"Segoe Script"', 'cursive'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
