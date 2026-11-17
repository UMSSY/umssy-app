import type { DocumentType } from "../constants/document-types.constants";

export interface DocumentState {
  documentType: DocumentType | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  previewUrl: string | null;
  progress: number;
  error: string | null;
}
