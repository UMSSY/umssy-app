import type { RadarReviewKind } from './radar-review-kind.types';
import type { RadarReviewDecision } from './radar-review-decision.types';
export interface ReviewDecisionVariables {
  kind: RadarReviewKind;
  id: string;
  decision: RadarReviewDecision;
}
