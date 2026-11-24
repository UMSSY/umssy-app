export type RadarReviewDecisionResult = {
  operationId: string;
  status: 'completed';
  kind: 'cv' | 'skill';
  targetId: string;
  decision: string;
  changed: boolean;
  userId: string;
  completedAt: string;
};
