import type { DocumentType } from "../constants/document-types.constants";
import type { DocumentCorrectionResponse } from "./document-correction-response.types";

export interface DocumentCorrectionFormProps {
  requestCode: string;
  token: string;
  initialDocumentType?: DocumentType | null;
  onSubmitted: (response: DocumentCorrectionResponse) => void;
  onCancel: () => void;
}
