export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
export const PDF_DEFAULT_FONT_SIZE = 8;
export const PDF_DEFAULT_TEXT_COLOR = '#000000';
export const PDF_REGULAR_CHAR_WIDTH_RATIO = 0.52;
export const PDF_BOLD_CHAR_WIDTH_RATIO = 0.58;

export const SURVEY_PDF_COLORS = {
  navy: '#0F2D59',
  crimson: '#A31D1D',
  inkDark: '#1E293B',
  inkBody: '#334155',
  inkMuted: '#64748B',
  cardBackground: '#F8FAFC',
  cardSurface: '#FFFFFF',
  border: '#E2E8F0',
  track: '#EEF2F6',
  leadBar: '#1D4ED8',
  comparisonBar: '#94A3B8',
  leadBackground: '#EFF6FF',
} as const;

export const SURVEY_PDF_LAYOUT = {
  printWidth: 523,
  leftX: 36,
  pageBottomLimit: 735,
} as const;
