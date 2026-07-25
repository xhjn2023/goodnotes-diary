// 设计令牌 — 对应 HTML 原型的 "Inkwell" 暖纸美学
export const theme = {
  colors: {
    paper: '#F5F1EA',
    paperDeep: '#EDE7DB',
    surface: '#FFFFFF',
    surfaceSoft: '#FBF9F4',
    ink: '#1C1917',
    inkSoft: '#44403C',
    inkMuted: '#78716C',
    inkFaint: '#A8A29E',
    honey: '#B45309',
    honeySoft: '#FEF3C7',
    honeyGlow: '#FDE68A',
    sage: '#4D7C5F',
    sageSoft: '#D1FAE5',
    rose: '#BE5A48',
    roseSoft: '#FCE7E3',
    border: '#E7E2D9',
    borderSoft: '#F0EBE0',
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
  spacing: (n: number) => `${n * 4}px`,
  fonts: {
    serif: 'Fraunces, Georgia, serif',
    sans: 'DM Sans, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
} as const;

export type Theme = typeof theme;
