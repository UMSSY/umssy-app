import type { DocumentType } from "../constants/document-types.constants";

export interface DocumentTypeFieldProps {
  value: DocumentType | null;
  onChange: (value: DocumentType) => void;
  isDisabled?: boolean;
  id?: string;
  error?: string | null;
}
