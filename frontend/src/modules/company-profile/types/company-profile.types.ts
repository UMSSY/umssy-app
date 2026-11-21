export interface CompanyProfile {
  id: string;
  name: string;
  sector: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
}

export type ProfileLoadStatus = "idle" | "loading" | "success" | "error";

export interface CompanyProfileViewState {
  status: ProfileLoadStatus;
  profile: CompanyProfile | null;
  errorMessage: string | null;
}