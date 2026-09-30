/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14211f',
        muted: '#687572',
        canvas: '#f6f7f4',
        line: '#e5e9e4',
        forest: '#176b52',
        mint: '#dff2e9',
        citrus: '#e9f276',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 14px 40px rgba(20, 33, 31, 0.06)',
      },
    },
  },
  plugins: [],
};
