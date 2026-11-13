import type { HEATMAP_TYPES } from '../constants/heatmap.constants.js';

export type HeatmapType = (typeof HEATMAP_TYPES)[number];

export type HeatmapExtraValueFormat = 'count' | 'percentage' | 'badge';

export interface HeatmapColumn {
  id: string;
  label: string;
  sublabel?: string;
  total?: number;
}

export interface HeatmapCell {
  columnId: string;
  count?: number;
  total?: number;
  percentage?: number;
  isEmpty?: boolean;
}

export interface HeatmapExtraValue {
  count?: number;
  percentage?: number;
  subtext?: string;
  badgeText?: string;
}

export interface HeatmapRow {
  skillId: string;
  skillName: string;
  cells: HeatmapCell[];
  extraValues?: Record<string, HeatmapExtraValue>;
}

export interface HeatmapExtraColumnConfig {
  id: string;
  label: string;
  sublabel?: string;
  format?: HeatmapExtraValueFormat;
}

export interface HeatmapResponse {
  heatmapType: HeatmapType;
  baseCount: number;
  baseLabel: string;
  columns: HeatmapColumn[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  rows: HeatmapRow[];
  quickReadSummary?: string;
}
