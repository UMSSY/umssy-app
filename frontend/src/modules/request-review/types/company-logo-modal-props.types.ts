import type { CompanyLogoBg } from "./company-logo-bg.types";

export interface CompanyLogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  requestCode: string | null;
  logoUrl: string;
  logoBg: CompanyLogoBg;
  onChangeLogoBg: (bg: CompanyLogoBg) => void;
}
