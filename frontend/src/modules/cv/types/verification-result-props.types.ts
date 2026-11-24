import type { DocumentVerification } from './document-verification.types';
export interface VerificationResultProps {
  doc: DocumentVerification | undefined;
  details: () => void;
}
