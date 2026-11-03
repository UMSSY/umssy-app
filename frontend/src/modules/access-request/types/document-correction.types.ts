import type { DocumentType } from "../constants/document-types.constants";

export interface DocumentCorrectionResponse {
  requestCode: string;
  status: "pending";
}

export interface DocumentCorrectionSelection {
  file: File;
  previewUrl: string;
}

export interface DocumentCorrectionFormProps {
  requestCode: string;
  token: string;
  initialDocumentType?: DocumentType | null;
  onSubmitted: (response: DocumentCorrectionResponse) => void;
  onCancel: () => void;
}
