import type { WorkExperienceItem } from "./work-experience-item.types";

export interface WorkExperienceCompanyGroup {
  companyName: string;
  positions: WorkExperienceItem[];
}
