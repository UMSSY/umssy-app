import type { ReviewAffinityLevel } from './review-affinity-level.types';

export interface ReviewAffinityArea {
  area: string;
  level: ReviewAffinityLevel;
  score: number;
}
