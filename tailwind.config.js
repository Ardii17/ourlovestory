/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lato', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
      colors: {
        rose: {
          50: '#f4f9f7',
          100: '#e3f0eb',
          200: '#c8ddd5',
          300: '#a0c4b8',
          400: '#5bb89a',
          500: '#2d8c6e',
          600: '#237a5e',
          700: '#1a5c47',
          800: '#1a5c47',
          900: '#0f3d2e',
          950: '#082a1e',
        },
        blush: {
          50: '#fef8f0',
          100: '#fdefd8',
          200: '#fbe0b0',
          300: '#f6c97a',
          400: '#f0ad4e',
          500: '#e8943a',
          600: '#cc7a28',
          700: '#a86020',
          800: '#8a4e1c',
          900: '#6b3c16',
        },
        cream: '#f0f5f3',
        petal: '#e3f0eb',
        wine: '#1a5c47',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'heart-beat': 'gentleBounce 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gentleBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
      backgroundImage: {
        'petal-gradient': 'linear-gradient(135deg, #f4f9f7 0%, #e3f0eb 50%, #f4f9f7 100%)',
        'rose-gradient': 'linear-gradient(135deg, #2d8c6e 0%, #e8943a 50%, #1a5c47 100%)',
        'dreamy': 'radial-gradient(ellipse at top, #e3f0eb 0%, #f4f9f7 50%, #f0f5f3 100%)',
      },
    },
  },
  plugins: [],
}
