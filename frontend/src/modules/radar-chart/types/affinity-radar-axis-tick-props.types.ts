import type { AreaId } from './area-id.types';
import type { RadarAreaScore } from './radar-area-score.types';

export interface AffinityRadarAxisTickProps {
  area: RadarAreaScore;
  x: number | string;
  y: number | string;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
  verticalAnchor?: 'start' | 'middle' | 'end';
  onAreaClick?: (areaId: AreaId) => void;
}
