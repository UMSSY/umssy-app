import type { RadarReviewKind } from './radar-review-kind.types';
import type { RadarReviewDecision } from './radar-review-decision.types';
export interface RadarReviewOperationResult {
  operationId: string;
  status: 'completed';
  kind: RadarReviewKind;
  targetId: string;
  decision: RadarReviewDecision;
  changed: boolean;
  userId: string | null;
  completedAt: string;
}
