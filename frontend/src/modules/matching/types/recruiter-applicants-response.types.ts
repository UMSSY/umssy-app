import type { RecruiterTarget } from "../types/recruiter-target.types";
import type { RecruiterApplicant } from "../types/recruiter-applicant.types";

export interface RecruiterApplicantsResponse {
  totalApplications?: number;
  vacancy: RecruiterTarget;
  applicants: RecruiterApplicant[];
}
