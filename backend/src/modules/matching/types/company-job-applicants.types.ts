export interface CompanyJobOfferRecord {
  id: string;
  title: string;
}

export interface JobApplicantRecord {
  id: string;
  appliedAt: Date;
  status: { title: string };
  radarConsent?: { consentToContact: boolean } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    headline: string | null;
  };
}

export interface JobApplicantResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
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
