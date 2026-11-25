import type { CompanyOcrFieldDetail } from "@/modules/access-requests";

export interface CompanyOcrComparisonEntry {
  id: string;
  label: string;
  data: CompanyOcrFieldDetail;
}
