/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 👈 REQUIRED to enable dark: styling classes
  theme: {
    extend: {},
  },
  plugins: [],
}