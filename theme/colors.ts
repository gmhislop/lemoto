export const colors = {

  // Basis
  background:      '#EBEBEB', // schermachtergrond — warm lichtgrijs
  backgroundCard:  '#FFFFFF', // kaarten op de achtergrond
  backgroundSoft:  '#F5F5F5', // inputs, secundaire vlakken
  backgroundMuted: '#DEDEDE', // dividers, skeleton
  border:          '#D0D0D0',

  // Tekst
  textPrimary:   '#111111',
  textSecondary: '#555555',
  textMuted:     '#999999',
  textInverse:   '#FFFFFF',

  // Stoplicht — ENIGE accenten in de app
  green:      '#3A9E5F',
  greenSoft:  '#EAF5EE',
  greenText:  '#1E6B3A',

  orange:     '#E07B2A',
  orangeSoft: '#FEF3E7',
  orangeText: '#9A4E0D',

  red:     '#D94040',
  redSoft: '#FDEAEA',
  redText: '#8B1A1A',

  // Overig
  white: '#FFFFFF',
  black: '#111111',
} as const;

export const darkColors = {
  background:      '#1C1C1E',
  backgroundCard:  '#2C2C2E',
  backgroundSoft:  '#3A3A3C',
  backgroundMuted: '#48484A',
  border:          '#48484A',
  textPrimary:     '#F5F5F5',
  textSecondary:   '#AEAEB2',
  textMuted:       '#636366',
  // stoplicht kleuren blijven gelijk
} as const;
