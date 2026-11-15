export interface CvPdfSectionFilters {
  includeContactInfo?: boolean;
  includeSummary?: boolean;
  includeWorkExperience?: boolean;
  includeEducation?: boolean;
  includeSkills?: boolean;
  includeCertifications?: boolean;
  includeProjects?: boolean;
}

export interface CvPdfRenderOptions {
  sections?: CvPdfSectionFilters;
  customTitle?: string;
}
