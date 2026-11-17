import type { AreaId } from './area-id.types';
import type { RadarAreaScore } from './radar-area-score.types';

export interface AffinityRadarDotProps {
  className?: string;
  area: RadarAreaScore;
  cx?: number;
  cy?: number;
  onAreaClick?: (areaId: AreaId) => void;
}
