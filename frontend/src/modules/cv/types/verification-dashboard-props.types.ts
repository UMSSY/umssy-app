import type { DocumentVerification } from './document-verification.types';
export interface VerificationDashboardProps {
  rows: DocumentVerification[];
  refresh: () => Promise<unknown>;
}
