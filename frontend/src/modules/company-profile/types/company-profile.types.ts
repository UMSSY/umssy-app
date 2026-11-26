export interface CompanyProfile {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
}
