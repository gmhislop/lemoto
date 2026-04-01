export const colors = {
  // Surfaces (light)
  background:       '#F9F9F9',
  surfaceLow:       '#F3F3F3',
  surfaceCard:      '#FFFFFF',
  surfaceContainer: '#EEEEEE',
  surfaceHigh:      '#E8E8E8',
  surfaceHighest:   '#E2E2E2',

  // Brand
  lime:     '#B3F72A',
  limeText: '#131F00',
  primary:  '#486800',

  // Text
  onSurface:        '#1B1B1B',
  onSurfaceVariant: '#424934',
  outline:          '#727A62',

  // Status
  green:  '#B3F72A',
  orange: '#FFB800',
  red:    '#D94040',

  // rgba helpers (outline-based overlays)
  outlineAlpha10: 'rgba(114,122,98,0.10)',
  outlineAlpha15: 'rgba(114,122,98,0.15)',
  outlineAlpha20: 'rgba(114,122,98,0.20)',
  outlineAlpha25: 'rgba(114,122,98,0.25)',
  headerBg:       'rgba(255,255,255,0.92)',
  headerBgStrong: 'rgba(255,255,255,0.95)',

  // Legacy aliases (for week-schedule and other older screens)
  textPrimary:    '#1B1B1B',
  textSecondary:  '#424934',
  textMuted:      '#727A62',
  textInverse:    '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundSoft: '#F3F3F3',
  backgroundMuted:'#E8E8E8',
  border:         '#E2E2E2',
  white: '#FFFFFF',
  black: '#1B1B1B',
  error: '#BA1A1A',
  greenSoft:  '#F3F3F3',
  orangeSoft: '#F3F3F3',
  redSoft:    '#F3F3F3',
} as const;

export const darkColors: typeof colors = {
  background:       '#111111',
  surfaceLow:       '#181818',
  surfaceCard:      '#1E1E1E',
  surfaceContainer: '#252525',
  surfaceHigh:      '#2C2C2C',
  surfaceHighest:   '#363636',

  lime:     '#B3F72A',
  limeText: '#131F00',
  primary:  '#9AD900',

  onSurface:        '#F0F0F0',
  onSurfaceVariant: '#B5C09C',
  outline:          '#8A9478',

  green:  '#B3F72A',
  orange: '#FFB800',
  red:    '#FF6B6B',

  outlineAlpha10: 'rgba(138,148,120,0.10)',
  outlineAlpha15: 'rgba(138,148,120,0.15)',
  outlineAlpha20: 'rgba(138,148,120,0.20)',
  outlineAlpha25: 'rgba(138,148,120,0.25)',
  headerBg:       'rgba(17,17,17,0.92)',
  headerBgStrong: 'rgba(17,17,17,0.95)',

  textPrimary:    '#F0F0F0',
  textSecondary:  '#B5C09C',
  textMuted:      '#8A9478',
  textInverse:    '#111111',
  backgroundCard: '#1E1E1E',
  backgroundSoft: '#181818',
  backgroundMuted:'#2C2C2C',
  border:         '#363636',
  white: '#FFFFFF',
  black: '#F0F0F0',
  error: '#FF6B6B',
  greenSoft:  '#181818',
  orangeSoft: '#181818',
  redSoft:    '#181818',
};

export type Colors = typeof colors;
