/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#59aeff',
          500: '#3b8eff',
          600: '#1e6bf5',
          700: '#1755e1',
          800: '#1946b6',
          900: '#1a3d8f',
          950: '#152757',
        },
        surface: {
          50: '#f8f9fc',
          100: '#f0f2f7',
          200: '#e4e7f0',
          300: '#d0d5e3',
          400: '#b6bdd2',
          500: '#9ea6be',
          600: '#858daa',
          700: '#6e7592',
          800: '#5b6178',
          900: '#4c5163',
          950: '#0b0e17',
        },
        up: '#10b981',
        down: '#ef4444',
        warn: '#f59e0b',
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
