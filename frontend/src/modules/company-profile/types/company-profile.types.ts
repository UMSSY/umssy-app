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