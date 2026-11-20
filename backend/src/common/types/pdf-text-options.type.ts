import type { PdfFont } from './pdf-font.type.js';

export interface PdfTextOptions {
  fontSize?: number;
  font?: PdfFont;
  color?: string;
  align?: 'left' | 'right';
  width?: number;
}
