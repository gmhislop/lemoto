export const typography = {

  fontFamily: {
    headline:     'SpaceGrotesk_700Bold',   // technical data, heroes, labels
    headlineMed:  'SpaceGrotesk_500Medium',
    headlineReg:  'SpaceGrotesk_400Regular',
    body:         'Inter_400Regular',
    bodyMed:      'Inter_500Medium',
    bodySemi:     'Inter_600SemiBold',
    // legacy aliases
    mono:         'SpaceGrotesk_400Regular',
    monoBold:     'SpaceGrotesk_700Bold',
  },

  size: {
    xs:      10,
    sm:      12,
    base:    14,
    md:      16,
    lg:      18,
    xl:      22,
    xxl:     32,
    display: 48,
    hero:    56,
    heroSub: 16,
  },

  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },

  lineHeight: {
    tight:  1.1,
    normal: 1.5,
    loose:  1.75,
  },
} as const;
