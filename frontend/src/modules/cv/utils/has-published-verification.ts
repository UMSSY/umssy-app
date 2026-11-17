import type { DocumentVerification } from '../types/document-verification.types';
import { isApproved } from './is-approved';
export const hasPublishedVerification = (doc: DocumentVerification) =>
  doc.synced && isApproved(doc.status) && doc.radarVersion !== null;
