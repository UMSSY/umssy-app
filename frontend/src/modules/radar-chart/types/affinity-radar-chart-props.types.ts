import type { AreaId } from './area-id.types';
import type { RadarAreaScore } from './radar-area-score.types';

export interface AffinityRadarChartProps {
  plotClassName?: string;
  projectedScores?: Partial<Record<AreaId, number>>;
  previousScores?: Partial<Record<AreaId, number>>;
  isComparisonEnabled?: boolean;
  highlightedArea?: AreaId;
  onComparisonChange?: (enabled: boolean) => void;
  previousPublishedAt?: string;
  publishedAt?: string | null;
  areas: RadarAreaScore[];
  average?: number;
  onAreaClick?: (areaId: AreaId) => void;
  className?: string;
}
