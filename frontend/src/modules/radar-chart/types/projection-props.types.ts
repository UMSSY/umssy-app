import type { RadarAreaScore } from './radar-area-score.types';
import type { Projection } from './projection.types';
export type ProjectionProps = {
  triggerLabel?: string;
  area: RadarAreaScore;
  areas: RadarAreaScore[];
  onProjectionChange?: (projection: Projection) => void;
  onOpenChange?: (open: boolean) => void;
};
