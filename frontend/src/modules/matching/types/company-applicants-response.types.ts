import type { CompanyApplicant } from "./company-applicant.types";
export interface CompanyApplicantsResponse {
  jobOfferId: string;
  jobTitle: string;
  total: number;
  applicants: CompanyApplicant[];
}
