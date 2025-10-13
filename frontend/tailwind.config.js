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
        },
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        }
      },
      backgroundImage: {
        'water-gradient': 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 35%, #a5b4fc 65%, #818cf8 100%)',
        'water-gradient-dark': 'linear-gradient(135deg, #312e81 0%, #3730a3 35%, #4338ca 65%, #4f46e5 100%)'
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(79, 70, 229, 0.35)'
      }
    },
  },
  plugins: [],
}
