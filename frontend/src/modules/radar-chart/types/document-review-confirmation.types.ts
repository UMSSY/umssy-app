import type { DocumentReviewDecision } from './document-review-decision.types';
export interface DocumentReviewConfirmation {
  id: string;
  decision: DocumentReviewDecision;
  name: string;
}
