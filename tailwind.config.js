/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea',
          600: '#7d2ae8',
          700: '#6b21a8',
          800: '#581c87',
          900: '#3b0764',
          DEFAULT: '#7d2ae8',
        },
        accent: {
          DEFAULT: '#00c4cc',
          light: '#33d4db',
          dark: '#00a8af',
          hover: '#00b3b8',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f9fa',
          2: '#f1f3f5',
          3: '#e9ecef',
          4: '#dee2e6',
          5: '#ced4da',
          'dark-0': '#050505',
          'dark-1': '#0a0a0a',
          'dark-2': '#13161a',
          'dark-3': '#1e1e1e',
          'dark-4': '#252627',
          'dark-5': '#2e2e2e',
        },
        muted: {
          DEFAULT: '#6b7280',
          light: '#9ca3af',
          dark: '#4b5563',
        },
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(125, 42, 232, 0.3)',
        'glow-accent': '0 0 20px rgba(0, 196, 204, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      zIndex: {
        'dropdown': '50',
        'sticky': '100',
        'modal-backdrop': '150',
        'modal': '200',
        'popover': '250',
        'tooltip': '300',
        'overlay': '400',
        'toast': '500',
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
