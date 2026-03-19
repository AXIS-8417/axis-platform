/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        axis: {
          bg: '#070C12',
          surface: '#0C1520',
          elevated: '#111B2A',
          card: '#141E2E',
          hover: '#1A2740',
          teal: '#00D9CC',
          'teal-dim': '#00A89E',
          amber: '#F0A500',
          'amber-dim': '#C48800',
          success: '#22C55E',
          warning: '#F0A500',
          danger: '#EF4444',
          info: '#3B82F6',
          border: '#1E293B',
          'border-strong': '#334155',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans KR"', '"IBM Plex Mono"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'teal-glow': '0 0 20px rgba(0, 217, 204, 0.15)',
        'amber-glow': '0 0 20px rgba(240, 165, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
