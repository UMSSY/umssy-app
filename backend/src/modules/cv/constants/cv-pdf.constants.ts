export const CV_PDF_PAGE = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
  MARGIN_LEFT: 42,
  MARGIN_RIGHT: 42,
  MARGIN_TOP: 45,
  MARGIN_BOTTOM: 45,
  get CONTENT_WIDTH() {
    return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;
  },
} as const;

export const CV_PDF_COLORS = {
  PRIMARY: [0.043, 0.145, 0.271] as [number, number, number],
  SECONDARY: [0.651, 0.098, 0.18] as [number, number, number],
  TEXT_MAIN: [0.043, 0.122, 0.18] as [number, number, number],
  TEXT_MUTED: [0.392, 0.455, 0.545] as [number, number, number],
  LINE_MUTED: [0.824, 0.855, 0.898] as [number, number, number],
  BACKGROUND_CHIP: [0.941, 0.957, 0.973] as [number, number, number],
} as const;

export const CV_PDF_FONTS = {
  REGULAR: "/F1",
  BOLD: "/F2",
  OBLIQUE: "/F3",
} as const;

export const CV_PDF_MIME_TYPE = "application/pdf";
