import type { RadarAreaScore } from './radar-profile.types';
import type { Projection } from './projection.types';
export type ProjectionProps = {
  area: RadarAreaScore;
  areas: RadarAreaScore[];
  onProjectionChange?: (projection: Projection) => void;
  onOpenChange?: (open: boolean) => void;
};
