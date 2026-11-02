export type PdfFont = 'Helvetica' | 'Helvetica-Bold';

export interface PdfTextOptions {
  fontSize?: number;
  font?: PdfFont;
  color?: string;
  align?: 'left' | 'right';
  width?: number;
}
