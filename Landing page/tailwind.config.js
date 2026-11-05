/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zipbi: {
          primary: '#0C7744',       // Exact reference green
          dark: '#085430',          // Deep forest green
          accent: '#22C55E',        // Vibrant green
          mint: '#E8F6EE',          // Pill background mint
          'mint-border': '#CDEBD8', // Pill border
          'mint-section': '#F1F9F4',// Full-width light mint background
          'mint-card': '#F8FAF9',   // Very light card background
        },
        slate: {
          charcoal: '#18181B',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(12, 119, 68, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -4px rgba(12, 119, 68, 0.08)',
      },
    },
  },
  plugins: [],
}
