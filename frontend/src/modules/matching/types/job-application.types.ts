export interface JobApplication {
  id: string;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
  status: string;
}

export interface MyJobApplication {
  hasApplied: boolean;
  application: JobApplication | null;
}
