/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#effaf8', 100: '#d3f3ee', 500: '#14917f', 600: '#0f766e', 700: '#115e59', 900: '#0b3b38' },
        paper: '#f5f6f4',
      },
    },
  },
  plugins: [],
};
