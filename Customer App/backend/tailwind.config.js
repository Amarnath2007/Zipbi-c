/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/admin/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1B4D3E',
          dark: '#143A2F',
          light: '#2D6A4F',
          accent: '#52B788',
          surface: '#F4F7F5',
        },
      },
    },
  },
  plugins: [],
};

