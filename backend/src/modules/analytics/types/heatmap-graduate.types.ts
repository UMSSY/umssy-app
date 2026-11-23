import type { EmploymentStatusId } from './employment-status-id.types.js';
import type { HeatmapSkill } from './heatmap-skill.types.js';
import type { SalaryRangeId } from './salary-range-id.types.js';

export interface HeatmapGraduate {
  userId: string;
  careerId: string;
  answeredAt: Date;
  skills: HeatmapSkill[];
  employmentStatus: EmploymentStatusId | null;
  salaryRange: SalaryRangeId | null;
  experienceYears: number | null;
}
