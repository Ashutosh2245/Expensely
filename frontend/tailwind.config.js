/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070B14',
          900: '#0B1120',
          850: '#0F172A',
          800: '#15213D',
          700: '#1E2D4E',
          600: '#334155'
        },
        card: {
          dark: '#0F172A',
          light: '#FFFFFF'
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          900: '#064E3B'
        },
        coral: {
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          900: '#881337'
        },
        brand: {
          purple: '#8B5CF6',
          indigo: '#6366F1',
          accent: '#A855F7'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      boxShadow: {
        premium: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        glow: '0 0 20px -2px rgba(139, 92, 246, 0.25)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.25)',
        'glow-coral': '0 0 20px -2px rgba(244, 63, 94, 0.25)'
      }
    }
  },
  plugins: []
};
