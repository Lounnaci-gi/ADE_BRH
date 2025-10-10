/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        water: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      backgroundImage: {
        'water-gradient': 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 35%, #7dd3fc 65%, #38bdf8 100%)',
        'water-gradient-dark': 'linear-gradient(135deg, #0c4a6e 0%, #075985 35%, #0369a1 65%, #0284c7 100%)'
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(2, 132, 199, 0.35)'
      }
    },
  },
  plugins: [],
}
