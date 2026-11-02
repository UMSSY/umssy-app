export interface JobApplicant {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  headline: string | null;
  appliedAt: string;
  status: string;
}
