import type { JobApplication } from "./job-application.types";

export interface MyJobApplication {
  hasApplied: boolean;
  application: JobApplication | null;
}
