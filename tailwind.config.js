/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#000000',
        card: '#121212',
        acid: '#CCFF00',
        electric: '#00D1FF',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        liquid: '2.5rem',
      },
      boxShadow: {
        acid: '0 0 15px rgba(204,255,0,0.4)',
        electric: '0 0 15px rgba(0,209,255,0.35)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
