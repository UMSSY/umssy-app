export interface CompanyApplicant {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  headline: string | null;
  appliedAt: string;
  status: string;
}
