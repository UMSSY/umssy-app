import type { DocumentVerification } from '../types/document-verification.types';
import { hasPublishedVerification } from './has-published-verification';
import { isApproved } from './is-approved';

export function getVerificationProgress(
  doc: DocumentVerification | null | undefined,
): number {
  if (!doc || doc.status === 'cancelled' || doc.status === 'legacy') return 0;
  if (hasPublishedVerification(doc)) return 4;
  if (isApproved(doc.status)) return 3;
  if (['review', 'manual_rejected', 'low_confidence'].includes(doc.status))
    return 2;
  return 1;
}
