export type HeatmapType = "skills-by-career" | "skills-by-salary" | "employability" | "skills-by-experience";

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

export type HeatmapExtraValueFormat = "count" | "percentage" | "badge";

export interface HeatmapExtraColumnConfig {
  id: string;
  label: string;
  sublabel?: string;
  format?: HeatmapExtraValueFormat;
}

export interface HeatmapData {
  heatmapType: HeatmapType;
  baseCount: number;
  baseLabel: string;
  columns: HeatmapColumn[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  rows: HeatmapRow[];
  quickReadSummary?: string;
}
