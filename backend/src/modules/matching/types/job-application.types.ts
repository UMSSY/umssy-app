export interface JobApplicationRecord {
  id: string;
  appliedAt: Date;
  status: { title: string };
  jobOffer: {
    id: string;
    title: string;
    company: { title: string };
  };
}

export interface JobApplicationResponse {
  id: string;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
  status: string;
}

export interface MyJobApplicationResponse {
  hasApplied: boolean;
  application: JobApplicationResponse | null;
}
