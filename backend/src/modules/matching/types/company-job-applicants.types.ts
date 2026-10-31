export interface CompanyJobOfferRecord {
  id: string;
  title: string;
}

export interface JobApplicantRecord {
  id: string;
  appliedAt: Date;
  status: { title: string };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    headline: string | null;
  };
}

export interface JobApplicantResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  headline: string | null;
  appliedAt: string;
  status: string;
}

export interface CompanyJobApplicantsResponse {
  jobOfferId: string;
  jobTitle: string;
  total: number;
  applicants: JobApplicantResponse[];
}
