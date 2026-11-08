export interface JobApplication {
  id: string;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
  status: string;
}

export type { MyJobApplication } from "./my-job-application.types";
