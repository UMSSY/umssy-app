import type { CompanyLogoBg } from "./company-logo-bg.types";

export interface CompanyLogoCardProps {
  companyName: string;
  requestCode: string | null;
  logoUrl: string | null;
  logoError: string | null;
  logoBg: CompanyLogoBg;
  isRetrying?: boolean;
  onChangeLogoBg: (bg: CompanyLogoBg) => void;
  onRetry?: () => void;
}
