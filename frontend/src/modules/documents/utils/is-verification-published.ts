import type { DocumentVerification } from '../types/document-verification.types';
import { isApproved } from './is-verification-approved';
export const isVerificationPublished = (doc: DocumentVerification) =>
  doc.synced && isApproved(doc.status) && doc.radarVersion !== null;
