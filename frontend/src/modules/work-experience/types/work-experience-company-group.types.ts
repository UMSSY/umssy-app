import type { WorkExperienceItem } from "./work-experience-item.types";

export interface WorkExperienceCompanyGroup {
  id: string;
  companyName: string;
  positions: WorkExperienceItem[];
}
