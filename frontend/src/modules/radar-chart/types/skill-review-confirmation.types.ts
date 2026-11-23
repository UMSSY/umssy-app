import type { RadarReviewDecision } from './radar-review-decision.types';
export interface SkillReviewConfirmation {
  id: string;
  decision: RadarReviewDecision;
  title: string;
}
