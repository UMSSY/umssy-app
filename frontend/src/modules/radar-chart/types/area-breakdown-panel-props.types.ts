import type { AreaId } from './area-id.types';
import type { RadarAreaScore } from './radar-area-score.types';

export interface AreaBreakdownPanelProps {
  compact?: boolean;
  selectedArea?: AreaId | null;
  onAreaClick?: (areaId: AreaId) => void;
  areas: RadarAreaScore[];
  average: number;
  className?: string;
}
