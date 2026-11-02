import type { JobApplicant } from "./job-applicant.types";

export interface JobOfferApplicants {
  jobOfferId: string;
  jobTitle: string;
  total: number;
  applicants: JobApplicant[];
}
