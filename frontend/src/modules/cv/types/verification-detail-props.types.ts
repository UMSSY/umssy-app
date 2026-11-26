import type { DocumentVerification } from './document-verification.types';
export interface VerificationDetailProps {
  doc: DocumentVerification | null;
  close: () => void;
  view: (doc: DocumentVerification) => void;
}
