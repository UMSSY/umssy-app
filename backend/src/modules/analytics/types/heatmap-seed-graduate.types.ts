import type { HeatmapSeedResponse } from './heatmap-seed-response.types.js';
import type { HeatmapSeedSkill } from './heatmap-seed-skill.types.js';
import type { HeatmapSeedWorkExperience } from './heatmap-seed-work-experience.types.js';

export interface HeatmapSeedGraduate {
  number: number;
  firstName: string;
  lastName: string;
  career: string;
  graduationYear: number;
  skills: HeatmapSeedSkill[];
  workExperiences: HeatmapSeedWorkExperience[];
  response: HeatmapSeedResponse | null;
}
