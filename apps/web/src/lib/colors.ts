/** NS기업 Dark Industrial Theme Colors */
export const colors = {
  bg: {
    primary: '#070C12',
    surface: '#0C1520',
    elevated: '#111B2A',
    card: '#141E2E',
    hover: '#1A2740',
  },
  accent: {
    teal: '#00D9CC',
    tealDim: '#00A89E',
    tealGlow: 'rgba(0, 217, 204, 0.15)',
    amber: '#F0A500',
    amberDim: '#C48800',
  },
  status: {
    success: '#22C55E',
    warning: '#F0A500',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
    inverse: '#070C12',
  },
  border: {
    subtle: '#1E293B',
    default: '#334155',
    strong: '#475569',
  },
  deviation: {
    normal: '#22C55E',
    mild: '#F0A500',
    severe: '#EF4444',
  },
} as const;

export type ThemeColors = typeof colors;
