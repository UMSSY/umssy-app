export type HeatmapCareerId = "systems" | "informatics";

export type HeatmapEmploymentStatus = "employed-in-field" | "employed-other-field" | "self-employed" | "job-seeking";

export interface HeatmapGraduateRecord {
  id: string;
  career: HeatmapCareerId;
  answeredAt: string;
  skills: string[];
  nlpSkills: string[];
  monthlySalary: number | null;
  employmentStatus: HeatmapEmploymentStatus | null;
  experienceYears: number | null;
}
