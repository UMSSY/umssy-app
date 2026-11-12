import type { HeatmapData, HeatmapType } from "../types/heatmap.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCareerHeatmap } from "./build-career-heatmap";
import { buildEmployabilityHeatmap } from "./build-employability-heatmap";
import { buildExperienceHeatmap } from "./build-experience-heatmap";
import { buildSalaryHeatmap } from "./build-salary-heatmap";

const BUILDERS: Record<HeatmapType, (records: HeatmapGraduateRecord[]) => HeatmapData> = {
  "skills-by-career": buildCareerHeatmap,
  "skills-by-salary": buildSalaryHeatmap,
  employability: buildEmployabilityHeatmap,
  "skills-by-experience": buildExperienceHeatmap,
};

export function buildHeatmapData(type: HeatmapType, records: HeatmapGraduateRecord[]): HeatmapData {
  return BUILDERS[type](records);
}
