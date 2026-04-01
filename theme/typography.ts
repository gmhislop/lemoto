export const typography = {

  // Font families
  fontFamily: {
    sans:     undefined,           // system default (SF Pro op iOS)
    mono:     'DMMono_400Regular', // data-waarden, hero-status, tijden
    monoBold: 'DMMono_500Medium',  // grote hero-waarden
  },

  // Font sizes
  size: {
    xs:      11,
    sm:      13,
    base:    15,
    md:      17,  // iOS standaard body
    lg:      20,
    xl:      24,
    xxl:     32,
    hero:    64,  // stoplicht status op detailscherm
    heroSub: 20,  // "kan ik rijden?" aanbeveling
  },

  // Font weights
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },

  // Line heights
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.75,
  },
} as const;
