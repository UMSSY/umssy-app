import type { OcrFieldMark } from "./ocr.types";

export interface DocumentViewerProps {
  url: string;
  mimeType: string;
  fileName: string;
  caption?: string;
  ocrMarks?: OcrFieldMark[];
  recipientName?: string;
  careerTitle?: string;
  graduationYear?: number | string;
}
