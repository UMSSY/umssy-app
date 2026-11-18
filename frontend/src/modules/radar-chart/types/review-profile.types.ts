import type { ReviewProfileStatus } from './review-profile-status.types';
import type { ReviewAffinityArea } from './review-affinity-area.types';

export interface ReviewProfile {
  id: number;
  fullName: string;
  targetPosition: string;
  submittedAt: string;
  globalAffinity: number;
  status: ReviewProfileStatus;
  areas: ReviewAffinityArea[];
}
