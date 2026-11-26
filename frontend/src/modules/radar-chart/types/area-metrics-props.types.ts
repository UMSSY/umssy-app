import type { AreaLevel } from './area-level.types';

export interface AreaMetricsProps {
  score: number;
  level: AreaLevel;
  gap: number;
  globalAverage: number;
}
