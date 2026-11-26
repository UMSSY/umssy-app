import type { DocumentType } from "../constants/document-types.constants";

export interface UploadDocumentResponse {
  id: string;
  documentFileId: string;
  documentType: DocumentType;
}
