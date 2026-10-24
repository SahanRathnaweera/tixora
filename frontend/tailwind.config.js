/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05140F',
          900: '#08211A',
          800: '#0B3027',
          700: '#114036',
          600: '#1A5547',
          500: '#2B7461',
        },
        gold: {
          200: '#F3E7C3',
          300: '#E8D5A3',
          400: '#D9BD7A',
          500: '#C9A45C',
          600: '#A8843F',
          700: '#8A6A2C',
        },
        cream: {
          50: '#FBFAF6',
          100: '#F7F4EC',
          200: '#EDE8DA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.15)' },
          '66%': { transform: 'translate(-30px, 25px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out backwards',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        aurora: 'aurora 14s ease-in-out infinite',
        'aurora-slow': 'aurora 22s ease-in-out infinite reverse',
        shimmer: 'shimmer 6s linear infinite',
        marquee: 'marquee 32s linear infinite',
        glow: 'glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}